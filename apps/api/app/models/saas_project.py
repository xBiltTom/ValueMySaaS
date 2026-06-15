import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import BusinessModel, SaasCategory, SaasStage


class SaasProject(Base):
    __tablename__ = "saas_projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[SaasCategory | None] = mapped_column(
        Enum(SaasCategory, name="saascategory", create_constraint=True),
        nullable=True,
        index=True,
    )
    stage: Mapped[SaasStage] = mapped_column(
        Enum(SaasStage, name="saasstage", create_constraint=True),
        nullable=False,
        default=SaasStage.IDEA,
        index=True,
    )
    business_model: Mapped[BusinessModel | None] = mapped_column(
        Enum(BusinessModel, name="businessmodel", create_constraint=True),
        nullable=True,
    )

    target_market: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_audience: Mapped[str | None] = mapped_column(Text, nullable=True)
    country_focus: Mapped[str | None] = mapped_column(String(100), nullable=True)
    main_problem: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_proposition: Mapped[str | None] = mapped_column(Text, nullable=True)
    competitors: Mapped[str | None] = mapped_column(Text, nullable=True)
    acquisition_strategy: Mapped[str | None] = mapped_column(Text, nullable=True)
    pricing_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(
        String(10), nullable=False, default="USD", server_default="USD"
    )
    is_public_sample: Mapped[bool] = mapped_column(
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
    owner: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="saas_projects", lazy="select"
    )
    metric_snapshots: Mapped[list["SaasMetricSnapshot"]] = relationship(  # noqa: F821
        "SaasMetricSnapshot", back_populates="saas_project", lazy="select"
    )
    scores: Mapped[list["SaasScore"]] = relationship(  # noqa: F821
        "SaasScore", back_populates="saas_project", lazy="select"
    )
    ai_analyses: Mapped[list["AiAnalysis"]] = relationship(  # noqa: F821
        "AiAnalysis", back_populates="saas_project", lazy="select"
    )
    chat_conversations: Mapped[list["ChatConversation"]] = relationship(  # noqa: F821
        "ChatConversation", back_populates="saas_project", lazy="select"
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        "Report", back_populates="saas_project", lazy="select"
    )

    __table_args__ = (
        Index(
            "uq_saas_projects_owner_slug",
            "owner_id",
            "slug",
            unique=True,
            postgresql_where=text("deleted_at IS NULL"),
        ),
        Index("ix_saas_projects_owner_stage", "owner_id", "stage"),
    )

    def __repr__(self) -> str:
        return f"<SaasProject id={self.id} name={self.name}>"
