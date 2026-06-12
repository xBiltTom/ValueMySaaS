import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Index, Integer, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import AiProvider


class SystemAiKey(Base):
    """API Key del sistema administrada por el admin.

    Cuando un usuario usa créditos en lugar de BYOK, el sistema consume
    una de estas keys (la de mayor prioridad activa).
    """
    __tablename__ = "system_ai_keys"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    provider: Mapped[AiProvider] = mapped_column(
        Enum(AiProvider, name="aiprovider", create_constraint=False),
        nullable=False,
    )
    label: Mapped[str] = mapped_column(String(100), nullable=False)

    # La key siempre se almacena encriptada
    encrypted_api_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    key_last_four: Mapped[str | None] = mapped_column(String(4), nullable=True)

    # Modelo por defecto a usar con esta key (si None, LiteLLM usa el default del proveedor)
    default_model: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Menor número = mayor prioridad. Si la key de prioridad 1 falla, se usa la 2.
    priority: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default=text("1")
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("provider", "label", name="uq_system_ai_keys_provider_label"),
        Index("ix_system_ai_keys_active_priority", "is_active", "priority"),
    )

    def __repr__(self) -> str:
        return f"<SystemAiKey id={self.id} provider={self.provider} priority={self.priority}>"
