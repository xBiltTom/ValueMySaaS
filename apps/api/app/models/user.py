import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Index, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="userrole", create_constraint=True),
        nullable=False,
        default=UserRole.USER,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
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
    saas_projects: Mapped[list["SaasProject"]] = relationship(  # noqa: F821
        "SaasProject", back_populates="owner", lazy="select"
    )
    ai_provider_keys: Mapped[list["AiProviderKey"]] = relationship(  # noqa: F821
        "AiProviderKey", back_populates="user", lazy="select"
    )
    ai_analyses: Mapped[list["AiAnalysis"]] = relationship(  # noqa: F821
        "AiAnalysis", back_populates="user", lazy="select"
    )
    chat_conversations: Mapped[list["ChatConversation"]] = relationship(  # noqa: F821
        "ChatConversation", back_populates="user", lazy="select"
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        "Report", back_populates="user", lazy="select"
    )

    __table_args__ = (
        UniqueConstraint("email"),
        UniqueConstraint("username"),
        Index("ix_users_email", "email"),
        Index("ix_users_username", "username"),
        Index("ix_users_email_active", "email", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email}>"
