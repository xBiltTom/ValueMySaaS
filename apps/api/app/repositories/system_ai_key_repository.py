from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_ai_key import SystemAiKey
from app.models.enums import AiProvider


class SystemAiKeyRepository:
    """Repositorio para las API Keys del sistema administradas por el admin."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, data: dict) -> SystemAiKey:
        key = SystemAiKey(**data)
        self.db.add(key)
        await self.db.flush()
        await self.db.refresh(key)
        return key

    async def get_active_key(self) -> SystemAiKey | None:
        """Obtiene la key del sistema activa con mayor prioridad (número menor)."""
        result = await self.db.execute(
            select(SystemAiKey)
            .where(
                SystemAiKey.is_active.is_(True),
                SystemAiKey.deleted_at.is_(None),
            )
            .order_by(SystemAiKey.priority.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_all_active_ordered(self) -> list[SystemAiKey]:
        """Devuelve todas las keys activas ordenadas por prioridad ASC para failover."""
        result = await self.db.execute(
            select(SystemAiKey)
            .where(
                SystemAiKey.is_active.is_(True),
                SystemAiKey.deleted_at.is_(None),
            )
            .order_by(SystemAiKey.priority.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, *, key_id: UUID) -> SystemAiKey | None:
        result = await self.db.execute(
            select(SystemAiKey).where(
                SystemAiKey.id == key_id,
                SystemAiKey.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        *,
        active_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> list[SystemAiKey]:
        statement = select(SystemAiKey).where(SystemAiKey.deleted_at.is_(None))
        if active_only:
            statement = statement.where(SystemAiKey.is_active.is_(True))
        statement = statement.order_by(SystemAiKey.priority.asc()).offset(offset).limit(limit)
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def count_all(self, *, active_only: bool = False) -> int:
        statement = select(func.count()).select_from(SystemAiKey).where(
            SystemAiKey.deleted_at.is_(None)
        )
        if active_only:
            statement = statement.where(SystemAiKey.is_active.is_(True))
        result = await self.db.execute(statement)
        return result.scalar_one()

    async def update(self, *, key: SystemAiKey, data: dict) -> SystemAiKey:
        for field, value in data.items():
            setattr(key, field, value)
        await self.db.flush()
        await self.db.refresh(key)
        return key

    async def soft_delete(self, *, key: SystemAiKey) -> None:
        key.deleted_at = datetime.now(timezone.utc)
        key.is_active = False
        await self.db.flush()
