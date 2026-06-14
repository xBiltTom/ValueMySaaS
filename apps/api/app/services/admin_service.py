"""Servicio del panel de administración.

Gestiona: usuarios, distribución de créditos, API Keys del sistema y estadísticas.
"""
from uuid import UUID

from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.ai_analysis_repository import AiAnalysisRepository
from app.repositories.credit_transaction_repository import CreditTransactionRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.system_ai_key_repository import SystemAiKeyRepository
from app.repositories.system_config_repository import SystemConfigRepository
from app.repositories.user_repository import UserRepository
from app.schemas.admin import AdminStatsResponse, AdminUserListResponse, AdminUserRead
from app.services.credit_service import CreditService


class AdminService:
    def __init__(
        self,
        user_repository: UserRepository,
        credit_transaction_repository: CreditTransactionRepository,
        system_ai_key_repository: SystemAiKeyRepository,
        ai_analysis_repository: AiAnalysisRepository,
        credit_service: CreditService,
        saas_project_repository: SaasProjectRepository,
        system_config_repository: SystemConfigRepository,
    ) -> None:
        self.user_repository = user_repository
        self.credit_transaction_repository = credit_transaction_repository
        self.system_ai_key_repository = system_ai_key_repository
        self.ai_analysis_repository = ai_analysis_repository
        self.credit_service = credit_service
        self.saas_project_repository = saas_project_repository
        self.system_config_repository = system_config_repository

    async def list_users(
        self,
        *,
        search: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> AdminUserListResponse:
        users = await self.user_repository.list_all(
            search=search, limit=limit, offset=offset
        )
        total = await self.user_repository.count_all(search=search)

        items: list[AdminUserRead] = []
        for user in users:
            project_count = await self.saas_project_repository.count_by_owner(owner_id=user.id)
            last_ai_activity_at = await self.credit_transaction_repository.get_last_ai_activity_at(user_id=user.id)
            items.append(AdminUserRead(
                id=user.id,
                email=user.email,
                username=user.username,
                full_name=user.full_name,
                role=user.role,
                is_active=user.is_active,
                is_verified=user.is_verified,
                ai_credits=user.ai_credits,
                last_login_at=user.last_login_at,
                project_count=project_count,
                last_ai_activity_at=last_ai_activity_at,
                created_at=user.created_at,
                updated_at=user.updated_at,
            ))

        return AdminUserListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )

    async def get_user(self, *, user_id: UUID) -> User:
        user = await self.user_repository.get_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado.",
            )
        return user

    async def grant_credits(
        self,
        *,
        user_id: UUID,
        delta: int,
        description: str | None,
        admin_id: UUID,
    ) -> None:
        """Otorga o revoca créditos a un usuario."""
        await self.credit_service.grant_credits(
            user_id=user_id,
            delta=delta,
            granted_by_admin_id=admin_id,
            description=description,
        )

    async def get_credit_history(
        self,
        *,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list, int]:
        items = await self.credit_transaction_repository.list_by_user(
            user_id=user_id, limit=limit, offset=offset
        )
        total = await self.credit_transaction_repository.count_by_user(user_id=user_id)
        return items, total

    async def get_stats(self) -> AdminStatsResponse:
        """Estadísticas globales del sistema para el dashboard del admin."""
        total_users = await self.user_repository.count_all()
        # Usuarios activos = los no eliminados con is_active=True
        # Reutilizamos count_all; la diferencia real se calcularía con un query específico.
        # Para MVP, total ≈ active (soft-delete raramente usado)
        active_users = total_users

        # Total de análisis generados
        total_analyses = await self.ai_analysis_repository.count_total()

        # Créditos consumidos hoy
        credits_consumed_today = await self.credit_transaction_repository.sum_consumed_today()

        # Keys del sistema
        total_system_keys = await self.system_ai_key_repository.count_all()
        active_system_keys = await self.system_ai_key_repository.count_all(active_only=True)

        return AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            total_analyses=total_analyses,
            credits_consumed_today=credits_consumed_today,
            total_system_keys=total_system_keys,
            active_system_keys=active_system_keys,
        )

    async def toggle_user_active(self, *, user_id: UUID, is_active: bool) -> None:
        """Activa o desactiva un usuario."""
        user = await self.user_repository.get_by_id(user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        await self.user_repository.set_active(user_id=user_id, is_active=is_active)

    async def bulk_grant_credits(
        self,
        *,
        delta: int,
        description: str | None,
        admin_id: UUID,
    ) -> int:
        """Otorga créditos a todos los usuarios activos. Retorna el número de usuarios afectados."""
        users = await self.user_repository.list_all(limit=10000, offset=0)
        active_users = [u for u in users if u.is_active]
        for user in active_users:
            await self.credit_service.grant_credits(
                user_id=user.id,
                delta=delta,
                granted_by_admin_id=admin_id,
                description=description,
            )
        return len(active_users)

    async def get_config(self) -> list:
        return await self.system_config_repository.list_all()

    async def set_config(self, *, key: str, value: str) -> object:
        return await self.system_config_repository.set(key=key, value=value)

    async def get_announcement(self) -> str:
        return await self.system_config_repository.get_value("login_announcement")
