import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AiProvider, ConversationStatus


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    saas_project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saas_projects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider: Mapped[AiProvider | None] = mapped_column(
        Enum(AiProvider, name="aiprovider", create_constraint=False),
        nullable=True,
    )
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    system_prompt_version: Mapped[str] = mapped_column(
        String(20), nullable=False, default="v1", server_default="v1"
    )
    status: Mapped[ConversationStatus] = mapped_column(
        Enum(ConversationStatus, name="conversationstatus", create_constraint=True),
        nullable=False,
        default=ConversationStatus.ACTIVE,
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
    saas_project: Mapped["SaasProject"] = relationship(  # noqa: F821
        "SaasProject", back_populates="chat_conversations", lazy="select"
    )
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="chat_conversations", lazy="select"
    )
    messages: Mapped[list["ChatMessage"]] = relationship(  # noqa: F821
        "ChatMessage", back_populates="conversation", lazy="select"
    )

    __table_args__ = (
        Index("ix_chat_conversations_user_status", "user_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<ChatConversation id={self.id} status={self.status}>"
