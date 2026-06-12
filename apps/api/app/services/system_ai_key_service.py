"""Servicio para gestionar las API Keys del sistema (admin panel)."""
from uuid import UUID

from fastapi import HTTPException, status

from app.core.security import decrypt_api_key, encrypt_api_key
from app.models.enums import AiProvider
from app.models.system_ai_key import SystemAiKey
from app.repositories.system_ai_key_repository import SystemAiKeyRepository
from app.services.llm_client_service import LlmClientService


class SystemAiKeyService:
    def __init__(
        self,
        system_ai_key_repository: SystemAiKeyRepository,
        llm_client_service: LlmClientService,
    ) -> None:
        self.system_ai_key_repository = system_ai_key_repository
        self.llm_client_service = llm_client_service

    async def create_key(
        self,
        *,
        provider: AiProvider,
        label: str,
        api_key: str,
        default_model: str | None = None,
        priority: int = 1,
    ) -> SystemAiKey:
        try:
            encrypted = encrypt_api_key(api_key)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al encriptar la API Key del sistema.",
            ) from exc
        return await self.system_ai_key_repository.create(
            data={
                "provider": provider,
                "label": label,
                "encrypted_api_key": encrypted,
                "key_last_four": api_key[-4:],
                "default_model": default_model,
                "priority": priority,
                "is_active": True,
            }
        )

    async def list_keys(
        self,
        *,
        active_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[SystemAiKey], int]:
        items = await self.system_ai_key_repository.list_all(
            active_only=active_only, limit=limit, offset=offset
        )
        total = await self.system_ai_key_repository.count_all(active_only=active_only)
        return items, total

    async def get_key(self, *, key_id: UUID) -> SystemAiKey:
        key = await self.system_ai_key_repository.get_by_id(key_id=key_id)
        if key is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API Key del sistema no encontrada.",
            )
        return key

    async def update_key(self, *, key_id: UUID, data: dict) -> SystemAiKey:
        key = await self.get_key(key_id=key_id)
        if "api_key" in data:
            plain = data.pop("api_key")
            try:
                data["encrypted_api_key"] = encrypt_api_key(plain)
                data["key_last_four"] = plain[-4:]
            except RuntimeError as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al encriptar la nueva API Key del sistema.",
                ) from exc
        return await self.system_ai_key_repository.update(key=key, data=data)

    async def delete_key(self, *, key_id: UUID) -> None:
        key = await self.get_key(key_id=key_id)
        await self.system_ai_key_repository.soft_delete(key=key)

    async def verify_key(
        self,
        *,
        key_id: UUID,
        model_name: str | None = None,
    ) -> dict:
        key = await self.get_key(key_id=key_id)
        try:
            decrypted = decrypt_api_key(key.encrypted_api_key)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al desencriptar la API Key del sistema.",
            ) from exc
        resolved_model = model_name or key.default_model
        response = await self.llm_client_service.verify_connection(
            provider=key.provider,
            api_key=decrypted,
            model_name=resolved_model,
        )
        return {
            "ok": True,
            "provider": key.provider,
            "model_name": response.model_name or resolved_model,
            "message": "API Key del sistema verificada correctamente.",
        }
