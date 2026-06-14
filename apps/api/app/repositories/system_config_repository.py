from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_config import SystemConfig

# Default values for system config keys
DEFAULT_CONFIG: dict[str, tuple[str, str]] = {
    "default_initial_credits": ("5", "Créditos que recibe cada nuevo usuario al registrarse."),
    "login_announcement": ("", "Mensaje de anuncio visible al iniciar sesión. Vacío = sin anuncio."),
    "system_credits_enabled": ("true", "Si 'true', el sistema de créditos está activo."),
}


class SystemConfigRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, key: str) -> SystemConfig | None:
        result = await self.db.execute(
            select(SystemConfig).where(SystemConfig.key == key)
        )
        return result.scalar_one_or_none()

    async def get_value(self, key: str) -> str:
        """Returns value for key, falling back to DEFAULT_CONFIG, then empty string."""
        record = await self.get(key)
        if record is not None:
            return record.value
        default_val, _ = DEFAULT_CONFIG.get(key, ("", ""))
        return default_val

    async def set(self, key: str, value: str) -> SystemConfig:
        record = await self.get(key)
        if record is None:
            desc = DEFAULT_CONFIG.get(key, ("", ""))[1]
            record = SystemConfig(key=key, value=value, description=desc)
            self.db.add(record)
        else:
            record.value = value
        await self.db.flush()
        await self.db.refresh(record)
        return record

    async def list_all(self) -> list[SystemConfig]:
        result = await self.db.execute(select(SystemConfig).order_by(SystemConfig.key))
        return list(result.scalars().all())
