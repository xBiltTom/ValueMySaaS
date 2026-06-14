from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import (
    BusinessModel,
    DecisionRecommendation,
    SaasCategory,
    SaasStage,
    SustainabilityLevel,
)


class DashboardRecommendation(BaseModel):
    priority: str
    title: str
    message: str


class PortfolioProjectSummary(BaseModel):
    project_id: UUID
    name: str
    slug: str
    overall_score: Decimal | None = None
    sustainability_level: SustainabilityLevel | None = None


class RecentProjectSummary(BaseModel):
    project_id: UUID
    name: str
    slug: str
    stage: SaasStage
    category: SaasCategory | None = None
    created_at: datetime


class PortfolioAlertProject(BaseModel):
    project_id: UUID
    name: str
    slug: str
    alerts: list[dict[str, Any]]


class PortfolioDashboardResponse(BaseModel):
    total_projects: int
    projects_by_stage: dict[str, int]
    projects_by_category: dict[str, int]
    average_overall_score: Decimal | None
    scores_by_sustainability: dict[str, int]
    healthiest_project: PortfolioProjectSummary | None
    riskiest_project: PortfolioProjectSummary | None
    recent_projects: list[RecentProjectSummary]
    high_alert_projects: list[PortfolioAlertProject]
    global_recommendations: list[DashboardRecommendation]


class ProjectSummary(BaseModel):
    id: UUID
    name: str
    slug: str
    stage: SaasStage
    category: SaasCategory | None = None
    business_model: BusinessModel | None = None
    current_price: Decimal | None = None
    currency: str


class LatestSnapshotSummary(BaseModel):
    id: UUID
    period_label: str | None = None
    captured_at: datetime


class LatestScoreSummary(BaseModel):
    overall_score: Decimal
    financial_score: Decimal | None = None
    growth_score: Decimal | None = None
    retention_score: Decimal | None = None
    product_score: Decimal | None = None
    risk_score: Decimal | None = None
    sustainability_level: SustainabilityLevel
    decision_recommendation: DecisionRecommendation


class MetricCards(BaseModel):
    mrr: Decimal | int | str | None = None
    arr: Decimal | int | str | None = None
    monthly_revenue: Decimal | int | str | None = None
    paying_customers: Decimal | int | str | None = None
    total_users: Decimal | int | str | None = None
    active_users: Decimal | int | str | None = None
    conversion_rate: Decimal | int | str | None = None
    churn_rate: Decimal | int | str | None = None
    retention_rate: Decimal | int | str | None = None
    ltv_cac_ratio: Decimal | int | str | None = None
    runway_months: Decimal | int | str | None = None
    uptime_percentage: Decimal | int | str | None = None


class SeriesPoint(BaseModel):
    date: datetime
    label: str | None = None
    value: Decimal | int | str | None


class ProjectSeries(BaseModel):
    mrr: list[SeriesPoint]
    monthly_revenue: list[SeriesPoint]
    paying_customers: list[SeriesPoint]
    active_users: list[SeriesPoint]
    churn_rate: list[SeriesPoint]
    overall_score: list[SeriesPoint]


class ProjectDashboardResponse(BaseModel):
    project: ProjectSummary
    latest_snapshot: LatestSnapshotSummary | None
    latest_score: LatestScoreSummary | None
    metric_cards: MetricCards
    alerts: list[dict[str, Any]]
    recommendations: list[dict[str, Any] | DashboardRecommendation]
    series: ProjectSeries
