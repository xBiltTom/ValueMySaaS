from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class CalculatedMetric(BaseModel):
    value: Decimal | int | str | None
    source: Literal["provided", "calculated", "missing"]
    formula: str | None
    explanation: str


class MetricCalculationSummary(BaseModel):
    provided_metrics_count: int
    calculated_metrics_count: int
    missing_metrics_count: int


class MetricCalculationResponse(BaseModel):
    project_id: UUID
    snapshot_id: UUID
    snapshot_captured_at: datetime
    previous_snapshot_id: UUID | None
    calculation_version: str = "v1"
    metrics: dict[str, CalculatedMetric]
    warnings: list[str]
    summary: MetricCalculationSummary
