from fastapi import APIRouter

from app.api.v1.endpoints import (
    ai_analyses,
    ai_keys,
    auth,
    dashboards,
    metric_calculations,
    metric_snapshots,
    reports,
    saas_projects,
    saas_scores,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(ai_keys.router)
api_router.include_router(saas_projects.router)
api_router.include_router(metric_snapshots.router)
api_router.include_router(metric_calculations.router)
api_router.include_router(saas_scores.router)
api_router.include_router(dashboards.router)
api_router.include_router(reports.router)
api_router.include_router(ai_analyses.router)
