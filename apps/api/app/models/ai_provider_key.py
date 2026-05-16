import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AiProvider


class AiProviderKey(Base):
    __tablename__ = "ai_provider_keys"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    provider: Mapped[AiProvider] = mapped_column(
        Enum(AiProvider, name="aiprovider", create_constraint=True),
        nullable=False,
    )
    label: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # API key is always stored encrypted; never stored in plain text.
    encrypted_api_key: Mapped[str] = mapped_column(String(1024), nullable=False)
    key_last_four: Mapped[str | None] = mapped_column(String(4), nullable=True)

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

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="ai_provider_keys", lazy="select"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "provider", "label", name="uq_ai_provider_keys_user_provider_label"),
        Index("ix_ai_provider_keys_user_provider", "user_id", "provider"),
    )

    def __repr__(self) -> str:
        return f"<AiProviderKey id={self.id} provider={self.provider} user={self.user_id}>"
