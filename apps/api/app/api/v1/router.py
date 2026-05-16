from fastapi import APIRouter

from app.api.v1.endpoints import auth, metric_snapshots, saas_projects

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(saas_projects.router)
api_router.include_router(metric_snapshots.router)
