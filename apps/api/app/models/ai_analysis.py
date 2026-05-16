import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AiAnalysisType, AiProvider


class AiAnalysis(Base):
    __tablename__ = "ai_analyses"

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
    score_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saas_scores.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    provider: Mapped[AiProvider] = mapped_column(
        Enum(AiProvider, name="aiprovider", create_constraint=False),
        nullable=False,
    )
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    analysis_type: Mapped[AiAnalysisType] = mapped_column(
        Enum(AiAnalysisType, name="aianalysistype", create_constraint=True),
        nullable=False,
    )

    # Versioning enables auditing prompt changes and reproducing old outputs
    prompt_version: Mapped[str] = mapped_column(String(20), nullable=False, default="v1")

    input_context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    output_text: Mapped[str] = mapped_column(Text, nullable=False)
    output_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    tokens_input: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tokens_output: Mapped[int | None] = mapped_column(Integer, nullable=True)
    estimated_cost: Mapped[float | None] = mapped_column(Numeric(10, 6), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    saas_project: Mapped["SaasProject"] = relationship(  # noqa: F821
        "SaasProject", back_populates="ai_analyses", lazy="select"
    )
    metric_snapshot: Mapped["SaasMetricSnapshot"] = relationship(  # noqa: F821
        "SaasMetricSnapshot", back_populates="ai_analyses", lazy="select"
    )
    user: Mapped["User"] = relationship(  # noqa: F821
        "User", back_populates="ai_analyses", lazy="select"
    )
    reports: Mapped[list["Report"]] = relationship(  # noqa: F821
        "Report", back_populates="ai_analysis", lazy="select"
    )

    def __repr__(self) -> str:
        return f"<AiAnalysis id={self.id} type={self.analysis_type} provider={self.provider}>"
