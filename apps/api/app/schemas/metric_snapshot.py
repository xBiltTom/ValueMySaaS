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
    
    # Extra fields sent by frontend (moved to custom_metrics by service)
    monthly_revenue: Decimal | None = None
    cash_available: Decimal | None = None
    marketing_spend: Decimal | None = None
    active_users: int | None = None
    new_users: int | None = None
    new_paying_customers: int | None = None
    churned_customers: int | None = None
    nps: int | None = None
    support_tickets: int | None = None
    critical_bugs: int | None = None
    uptime_percentage: Decimal | None = None

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
