import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import CreditReason


class CreditTransaction(Base):
    """Registro de auditoría de cada operación de crédito de IA.

    Cada consumo (análisis, chat) o recarga (admin) queda registrado aquí.
    Permite trazabilidad completa del gasto de créditos por usuario.
    """
    __tablename__ = "credit_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # Positivo = recarga, negativo = consumo
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)

    reason: Mapped[CreditReason] = mapped_column(
        Enum(CreditReason, name="creditreason", create_constraint=True),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # FK opcional al análisis que consumió el crédito
    related_analysis_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_analyses.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Admin que otorgó/revocó (solo para ADMIN_GRANT/REVOKE)
    granted_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", foreign_keys=[user_id], back_populates="credit_transactions", lazy="select"
    )

    __table_args__ = (
        Index("ix_credit_transactions_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<CreditTransaction id={self.id} user={self.user_id} delta={self.delta} reason={self.reason}>"
