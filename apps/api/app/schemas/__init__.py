# Pydantic schemas will be defined here per domain module.
from app.schemas.auth import Token, UserRead, UserRegister
from app.schemas.metric_snapshot import (
    MetricSnapshotCreate,
    MetricSnapshotListItem,
    MetricSnapshotListResponse,
    MetricSnapshotRead,
    MetricSnapshotUpdate,
)
from app.schemas.saas_project import (
    SaasProjectCreate,
    SaasProjectListItem,
    SaasProjectListResponse,
    SaasProjectRead,
    SaasProjectUpdate,
)
from app.schemas.saas_score import (
    SaasScoreListItem,
    SaasScoreListResponse,
    SaasScoreRead,
    ScoreAlertItem,
    ScoreDiagnosticItem,
    ScoreRecommendationItem,
)

__all__ = [
    "MetricSnapshotCreate",
    "MetricSnapshotListItem",
    "MetricSnapshotListResponse",
    "MetricSnapshotRead",
    "MetricSnapshotUpdate",
    "SaasProjectCreate",
    "SaasProjectListItem",
    "SaasProjectListResponse",
    "SaasProjectRead",
    "SaasProjectUpdate",
    "SaasScoreListItem",
    "SaasScoreListResponse",
    "SaasScoreRead",
    "ScoreAlertItem",
    "ScoreDiagnosticItem",
    "ScoreRecommendationItem",
    "Token",
    "UserRead",
    "UserRegister",
]
