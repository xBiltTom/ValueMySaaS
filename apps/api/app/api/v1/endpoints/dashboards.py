from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_dashboard_service
from app.models.user import User
from app.schemas.dashboard import PortfolioDashboardResponse, ProjectDashboardResponse
from app.services.dashboard_service import DashboardService

router = APIRouter(tags=["Dashboards"])


@router.get("/dashboard/portfolio", response_model=PortfolioDashboardResponse)
async def get_portfolio_dashboard(
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return await dashboard_service.get_portfolio_dashboard(owner_id=current_user.id)


@router.get("/saas-projects/{project_id}/dashboard", response_model=ProjectDashboardResponse)
async def get_project_dashboard(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
):
    return await dashboard_service.get_project_dashboard(
        project_id=project_id,
        owner_id=current_user.id,
    )
