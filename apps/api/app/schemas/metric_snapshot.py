from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MetricSnapshotBase(BaseModel):
    period_label: str | None = Field(default=None, max_length=100)
    mrr: Decimal | None = Field(default=None, ge=0)
    monthly_costs: Decimal | None = Field(default=None, ge=0)
    total_users: int | None = Field(default=None, ge=0)
    paying_customers: int | None = Field(default=None, ge=0)
    cac: Decimal | None = Field(default=None, ge=0)
    churn_rate: Decimal | None = None
    custom_metrics: dict[str, Any] | None = None
    notes: str | None = None


class MetricSnapshotCreate(MetricSnapshotBase):
    captured_at: datetime | None = None


class MetricSnapshotUpdate(MetricSnapshotBase):
    captured_at: datetime | None = None


class MetricSnapshotRead(MetricSnapshotBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    saas_project_id: UUID
    captured_at: datetime
    created_at: datetime
    updated_at: datetime


class MetricSnapshotListItem(MetricSnapshotRead):
    pass


class MetricSnapshotListResponse(BaseModel):
    items: list[MetricSnapshotListItem]
    total: int
    limit: int
    offset: int
