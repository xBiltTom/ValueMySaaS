from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    metric_calculations,
    metric_snapshots,
    saas_projects,
    saas_scores,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(saas_projects.router)
api_router.include_router(metric_snapshots.router)
api_router.include_router(metric_calculations.router)
api_router.include_router(saas_scores.router)
