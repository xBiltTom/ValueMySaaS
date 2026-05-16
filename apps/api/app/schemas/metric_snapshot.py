from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MetricSnapshotBase(BaseModel):
    period_label: str | None = Field(default=None, max_length=100)
    mrr: Decimal | None = Field(default=None, ge=0)
    arr: Decimal | None = Field(default=None, ge=0)
    monthly_revenue: Decimal | None = Field(default=None, ge=0)
    monthly_costs: Decimal | None = Field(default=None, ge=0)
    gross_profit: Decimal | None = Field(default=None, ge=0)
    net_profit: Decimal | None = Field(default=None, ge=0)
    cash_available: Decimal | None = Field(default=None, ge=0)
    burn_rate: Decimal | None = Field(default=None, ge=0)
    total_users: int | None = Field(default=None, ge=0)
    active_users: int | None = Field(default=None, ge=0)
    paying_customers: int | None = Field(default=None, ge=0)
    new_users: int | None = Field(default=None, ge=0)
    new_paying_customers: int | None = Field(default=None, ge=0)
    churned_customers: int | None = Field(default=None, ge=0)
    cac: Decimal | None = Field(default=None, ge=0)
    marketing_spend: Decimal | None = Field(default=None, ge=0)
    churn_rate: Decimal | None = None
    retention_rate: Decimal | None = None
    conversion_rate: Decimal | None = None
    arpu: Decimal | None = Field(default=None, ge=0)
    ltv: Decimal | None = Field(default=None, ge=0)
    ltv_cac_ratio: Decimal | None = None
    payback_months: Decimal | None = Field(default=None, ge=0)
    growth_rate: Decimal | None = None
    runway_months: Decimal | None = Field(default=None, ge=0)
    nps: Decimal | None = Field(default=None, ge=-100, le=100)
    avg_session_minutes: Decimal | None = Field(default=None, ge=0)
    support_tickets: int | None = Field(default=None, ge=0)
    critical_bugs: int | None = Field(default=None, ge=0)
    uptime_percentage: Decimal | None = Field(default=None, ge=0, le=100)
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
