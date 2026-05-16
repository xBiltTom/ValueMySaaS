import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ReportStatus, ReportType


class Report(Base):
    __tablename__ = "reports"

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
    metric_snapshot_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saas_metric_snapshots.id", ondelete="SET NULL"),
        nullable=True,
    )
    score_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saas_scores.id", ondelete="SET NULL"),
        nullable=True,
    )
    ai_analysis_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_analyses.id", ondelete="SET NULL"),
        nullable=True,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    report_type: Mapped[ReportType] = mapped_column(
        Enum(ReportType, name="reporttype", create_constraint=True),
        nullable=False,
    )
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="reportstatus", create_constraint=True),
        nullable=False,
        default=ReportStatus.DRAFT,
    )

    content: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Generic URL — not coupled to any storage provider.
    # May point to local storage, S3, Supabase Storage, Cloudinary, etc.
    file_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

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
        "SaasProject", back_populates="reports", lazy="select"
    )
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="reports", lazy="select"
    )
    metric_snapshot: Mapped["SaasMetricSnapshot"] = relationship(  # noqa: F821
        "SaasMetricSnapshot", back_populates="reports", lazy="select"
    )
    score: Mapped["SaasScore"] = relationship(  # noqa: F821
        "SaasScore", back_populates="reports", lazy="select"
    )
    ai_analysis: Mapped["AiAnalysis"] = relationship(  # noqa: F821
        "AiAnalysis", back_populates="reports", lazy="select"
    )

    __table_args__ = (
        Index("ix_reports_project_status", "saas_project_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Report id={self.id} title={self.title} type={self.report_type}>"
