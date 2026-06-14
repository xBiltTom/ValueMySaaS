from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SystemConfig(Base):
    """Configuración global del sistema administrada por el admin.

    Almacena pares clave-valor para configuración dinámica:
    - default_initial_credits: créditos que recibe cada nuevo usuario
    - login_announcement: mensaje visible al iniciar sesión (vacío = sin anuncio)
    - system_credits_enabled: 'true'/'false' — si el sistema de créditos está activo
    """
    __tablename__ = "system_config"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<SystemConfig key={self.key} value={self.value[:30]}>"
