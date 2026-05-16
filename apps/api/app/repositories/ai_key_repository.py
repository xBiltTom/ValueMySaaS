from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_provider_key import AiProviderKey
from app.models.enums import AiProvider


class AiProviderKeyRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, data: dict) -> AiProviderKey:
        key = AiProviderKey(**data)
        self.db.add(key)
        await self.db.flush()
        await self.db.refresh(key)
        return key

    async def list_by_user(
        self,
        *,
        user_id: UUID,
        provider: AiProvider | None = None,
        active_only: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> list[AiProviderKey]:
        statement = self._user_query(user_id=user_id, provider=provider, active_only=active_only)
        statement = statement.order_by(AiProviderKey.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def count_by_user(
        self,
        *,
        user_id: UUID,
        provider: AiProvider | None = None,
        active_only: bool = False,
    ) -> int:
        statement = self._user_query(user_id=user_id, provider=provider, active_only=active_only)
        result = await self.db.execute(select(func.count()).select_from(statement.subquery()))
        return result.scalar_one()

    async def get_by_id_for_user(self, *, key_id: UUID, user_id: UUID) -> AiProviderKey | None:
        result = await self.db.execute(
            select(AiProviderKey).where(
                AiProviderKey.id == key_id,
                AiProviderKey.user_id == user_id,
                AiProviderKey.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_active_by_id_for_user(self, *, key_id: UUID, user_id: UUID) -> AiProviderKey | None:
        result = await self.db.execute(
            select(AiProviderKey).where(
                AiProviderKey.id == key_id,
                AiProviderKey.user_id == user_id,
                AiProviderKey.is_active.is_(True),
                AiProviderKey.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def get_by_user_provider_label(
        self,
        *,
        user_id: UUID,
        provider: AiProvider,
        label: str | None,
    ) -> AiProviderKey | None:
        result = await self.db.execute(
            select(AiProviderKey).where(
                AiProviderKey.user_id == user_id,
                AiProviderKey.provider == provider,
                AiProviderKey.label == label,
                AiProviderKey.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def update(self, *, key: AiProviderKey, data: dict) -> AiProviderKey:
        for field, value in data.items():
            setattr(key, field, value)
        await self.db.flush()
        await self.db.refresh(key)
        return key

    async def soft_delete(self, *, key: AiProviderKey) -> None:
        key.deleted_at = datetime.now(timezone.utc)
        key.is_active = False
        await self.db.flush()

    def _user_query(self, *, user_id: UUID, provider: AiProvider | None, active_only: bool):
        statement = select(AiProviderKey).where(
            AiProviderKey.user_id == user_id,
            AiProviderKey.deleted_at.is_(None),
        )
        if provider is not None:
            statement = statement.where(AiProviderKey.provider == provider)
        if active_only:
            statement = statement.where(AiProviderKey.is_active.is_(True))
        return statement
