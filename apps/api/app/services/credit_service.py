"""Servicio de créditos de IA — Implementa la jerarquía BYOK → Créditos → Error.

Jerarquía de resolución de credenciales para el LLM:
  1. BYOK: Si el usuario provee ai_key_id → usar su propia API key (sin créditos).
  2. Créditos del sistema: Si ai_key_id es None y ai_credits > 0 →
        usar la system_ai_key activa + decrementar 1 crédito.
  3. Sin acceso: Si no tiene ninguno → HTTP 402 con mensaje amigable.
"""
from dataclasses import dataclass, field
from uuid import UUID

from fastapi import HTTPException, status

from app.core.security import decrypt_api_key, encrypt_api_key
from app.models.enums import AiProvider, CreditReason
from app.models.user import User
from app.repositories.ai_key_repository import AiProviderKeyRepository
from app.repositories.credit_transaction_repository import CreditTransactionRepository
from app.repositories.system_ai_key_repository import SystemAiKeyRepository
from app.repositories.system_config_repository import SystemConfigRepository
from app.repositories.user_repository import UserRepository


@dataclass
class LlmCredentials:
    """Credenciales resueltas para llamar al LLM."""
    provider: AiProvider
    api_key: str
    model_name: str | None
    # True si se usaron créditos del sistema (para descontarlos después)
    credit_used: bool
    # ID de la system key usada (para auditoría), None si es BYOK
    system_key_id: UUID | None = None
    # Keys de sistema adicionales a intentar en orden si la primaria falla (failover)
    # Cada tupla: (provider, api_key_decrypted, default_model)
    fallback_system_keys: list[tuple[AiProvider, str, str | None]] = field(default_factory=list)


class CreditService:
    """Servicio central para resolver credenciales LLM y gestionar créditos."""

    def __init__(
        self,
        user_repository: UserRepository,
        ai_key_repository: AiProviderKeyRepository,
        system_ai_key_repository: SystemAiKeyRepository,
        credit_transaction_repository: CreditTransactionRepository,
        system_config_repository: SystemConfigRepository,
    ) -> None:
        self.user_repository = user_repository
        self.ai_key_repository = ai_key_repository
        self.system_ai_key_repository = system_ai_key_repository
        self.credit_transaction_repository = credit_transaction_repository
        self.system_config_repository = system_config_repository

    async def resolve_llm_credentials(
        self,
        *,
        user: User,
        ai_key_id: UUID | None,
        use_system_credits: bool = False,
    ) -> LlmCredentials:
        """Resuelve qué credenciales usar para llamar al LLM.

        Sigue la jerarquía: BYOK → Créditos del sistema → Error 402.
        NO consume el crédito aquí; eso se hace en consume_credit() después
        de que el análisis se complete con éxito.
        """
        # --- Caso 1: BYOK ---
        key = None
        if not use_system_credits:
            if ai_key_id is not None:
                key = await self.ai_key_repository.get_active_by_id_for_user(
                    key_id=ai_key_id, user_id=user.id
                )
                if key is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="API Key propia no encontrada o inactiva.",
                    )
            else:
                # Intentar obtener la primera API Key activa del usuario (fallback automático a BYOK)
                keys = await self.ai_key_repository.list_by_user(user_id=user.id, active_only=True, limit=1)
                if keys:
                    key = keys[0]

        if key is not None:
            try:
                decrypted = decrypt_api_key(key.encrypted_api_key)
            except RuntimeError as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error desencriptando tu API Key.",
                ) from exc
            return LlmCredentials(
                provider=key.provider,
                api_key=decrypted,
                model_name=None,  # El usuario especificará el modelo en el request o usa el por defecto
                credit_used=False,
            )

        # --- Caso 2: Créditos del sistema ---
        system_credits_enabled = await self.system_config_repository.get_value("system_credits_enabled")
        if system_credits_enabled != "true":
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="El sistema de créditos está temporalmente desactivado por el administrador. Por favor, configura tu propia API Key.",
            )

        if user.ai_credits > 0:
            system_keys = await self.system_ai_key_repository.get_all_active_ordered()
            if not system_keys:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=(
                        "El sistema de créditos no está configurado. "
                        "Contacta al administrador o usa tu propia API Key."
                    ),
                )
            primary_key = system_keys[0]
            try:
                decrypted = decrypt_api_key(primary_key.encrypted_api_key)
            except RuntimeError as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error interno en la clave del sistema.",
                ) from exc

            # Construir lista de fallback con las keys restantes (ignorar las que fallen al desencriptar)
            fallback: list[tuple[AiProvider, str, str | None]] = []
            for sk in system_keys[1:]:
                try:
                    fallback.append((sk.provider, decrypt_api_key(sk.encrypted_api_key), sk.default_model))
                except RuntimeError:
                    pass

            return LlmCredentials(
                provider=primary_key.provider,
                api_key=decrypted,
                model_name=primary_key.default_model,
                credit_used=True,
                system_key_id=primary_key.id,
                fallback_system_keys=fallback,
            )

        # --- Caso 3: Sin acceso ---
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                "No tienes créditos de IA disponibles y no tienes una API Key configurada. "
                "Opciones: (1) Configura tu propia API Key en Configuración → IA, "
                "o (2) Contacta a tu administrador para recibir más créditos."
            ),
        )

    async def consume_credit(
        self,
        *,
        user_id: UUID,
        reason: CreditReason,
        description: str | None = None,
        related_analysis_id: UUID | None = None,
    ) -> None:
        """Descuenta 1 crédito y registra la transacción. Llama solo si credit_used=True."""
        decremented = await self.user_repository.decrement_credits(user_id=user_id)
        if not decremented:
            # Esto solo ocurre si hubo race condition (el crédito fue consumido
            # concurrentemente). En producción con PostgreSQL el UPDATE atómico
            # previene doble consumo; este raise es un guard extra.
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Créditos insuficientes. Por favor configura tu propia API Key.",
            )
        # Obtener balance actualizado para el registro
        user = await self.user_repository.get_by_id(user_id)
        balance_after = user.ai_credits if user else 0
        await self.credit_transaction_repository.create(
            user_id=user_id,
            delta=-1,
            balance_after=balance_after,
            reason=reason,
            description=description,
            related_analysis_id=related_analysis_id,
        )

    async def grant_credits(
        self,
        *,
        user_id: UUID,
        delta: int,
        granted_by_admin_id: UUID,
        description: str | None = None,
    ) -> None:
        """Otorga `delta` créditos a un usuario. Solo para el admin.

        `delta` puede ser negativo para revocar créditos (mínimo 0).
        """
        if delta == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El delta de créditos no puede ser 0.",
            )
        user = await self.user_repository.get_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado.",
            )

        # Para revocaciones, no permitir créditos negativos
        if delta < 0 and user.ai_credits + delta < 0:
            delta = -user.ai_credits  # Revoca exactamente lo que tiene

        if delta == 0:
            return  # Nada que hacer

        await self.user_repository.increment_credits(user_id=user_id, delta=delta)
        updated_user = await self.user_repository.get_by_id(user_id)
        balance_after = updated_user.ai_credits if updated_user else 0

        reason = CreditReason.ADMIN_GRANT if delta > 0 else CreditReason.ADMIN_REVOKE
        await self.credit_transaction_repository.create(
            user_id=user_id,
            delta=delta,
            balance_after=balance_after,
            reason=reason,
            description=description,
            granted_by_admin_id=granted_by_admin_id,
        )
