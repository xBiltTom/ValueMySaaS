from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import DecisionRecommendation, SustainabilityLevel


class ScoreDiagnosticItem(BaseModel):
    code: str
    title: str
    message: str


class ScoreAlertItem(ScoreDiagnosticItem):
    severity: str


class ScoreRecommendationItem(BaseModel):
    priority: str
    title: str
    message: str


class SaasScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    saas_project_id: UUID
    metric_snapshot_id: UUID | None
    overall_score: Decimal
    financial_score: Decimal | None
    growth_score: Decimal | None
    retention_score: Decimal | None
    product_score: Decimal | None
    risk_score: Decimal | None
    sustainability_level: SustainabilityLevel
    decision_recommendation: DecisionRecommendation
    strengths: list[dict[str, Any]] | None
    weaknesses: list[dict[str, Any]] | None
    alerts: list[dict[str, Any]] | None
    recommendations: list[dict[str, Any]] | None
    scoring_version: str
    created_at: datetime


class SaasScoreListItem(SaasScoreRead):
    pass


class SaasScoreListResponse(BaseModel):
    items: list[SaasScoreListItem]
    total: int
    limit: int
    offset: int
