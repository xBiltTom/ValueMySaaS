import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SaasMetricSnapshot(Base):
    __tablename__ = "saas_metric_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    saas_project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saas_projects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    period_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Financial metrics
    mrr: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    arr: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    monthly_revenue: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    monthly_costs: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    gross_profit: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    net_profit: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    cash_available: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    burn_rate: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)

    # Acquisition metrics
    total_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    paying_customers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_paying_customers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    churned_customers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cac: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    marketing_spend: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)

    # SaaS metrics (stored as percentages or ratios)
    churn_rate: Mapped[Decimal | None] = mapped_column(Numeric(8, 4), nullable=True)
    retention_rate: Mapped[Decimal | None] = mapped_column(Numeric(8, 4), nullable=True)
    conversion_rate: Mapped[Decimal | None] = mapped_column(Numeric(8, 4), nullable=True)
    arpu: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    ltv: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    ltv_cac_ratio: Mapped[Decimal | None] = mapped_column(Numeric(8, 4), nullable=True)
    payback_months: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    growth_rate: Mapped[Decimal | None] = mapped_column(Numeric(8, 4), nullable=True)
    runway_months: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)

    # Product / service metrics
    nps: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    avg_session_minutes: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    support_tickets: Mapped[int | None] = mapped_column(Integer, nullable=True)
    critical_bugs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uptime_percentage: Mapped[Decimal | None] = mapped_column(Numeric(6, 3), nullable=True)

    # Flexible extra data
    custom_metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    saas_project: Mapped["SaasProject"] = relationship(  # noqa: F821
        "SaasProject", back_populates="metric_snapshots", lazy="select"
    )
    scores: Mapped[list["SaasScore"]] = relationship(  # noqa: F821
        "SaasScore", back_populates="metric_snapshot", lazy="select"
    )
    ai_analyses: Mapped[list["AiAnalysis"]] = relationship(  # noqa: F821
        "AiAnalysis", back_populates="metric_snapshot", lazy="select"
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        "Report", back_populates="metric_snapshot", lazy="select"
    )

    __table_args__ = (
        Index("ix_metric_snapshots_project_captured", "saas_project_id", "captured_at"),
    )

    def __repr__(self) -> str:
        return f"<SaasMetricSnapshot id={self.id} project={self.saas_project_id} period={self.period_label}>"
