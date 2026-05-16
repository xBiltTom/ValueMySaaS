import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import DecisionRecommendation, SustainabilityLevel


class SaasScore(Base):
    __tablename__ = "saas_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    saas_project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saas_projects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    metric_snapshot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saas_metric_snapshots.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    overall_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    financial_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    growth_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    retention_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    product_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    risk_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    sustainability_level: Mapped[SustainabilityLevel] = mapped_column(
        Enum(SustainabilityLevel, name="sustainabilitylevel", create_constraint=True),
        nullable=False,
        default=SustainabilityLevel.INSUFFICIENT_DATA,
    )
    decision_recommendation: Mapped[DecisionRecommendation] = mapped_column(
        Enum(DecisionRecommendation, name="decisionrecommendation", create_constraint=True),
        nullable=False,
        default=DecisionRecommendation.INSUFFICIENT_DATA,
    )

    strengths: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    alerts: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    recommendations: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Version allows evolving the scoring formula without invalidating old scores
    scoring_version: Mapped[str] = mapped_column(
        String(20), nullable=False, default="v1", server_default="v1"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    saas_project: Mapped["SaasProject"] = relationship(  # noqa: F821
        "SaasProject", back_populates="scores", lazy="select"
    )
    metric_snapshot: Mapped["SaasMetricSnapshot"] = relationship(  # noqa: F821
        "SaasMetricSnapshot", back_populates="scores", lazy="select"
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        "Report", back_populates="score", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<SaasScore id={self.id} overall={self.overall_score} level={self.sustainability_level}>"
