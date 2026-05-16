from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_metric_calculation_service
from app.models.user import User
from app.schemas.metric_calculation import MetricCalculationResponse
from app.services.metric_calculation_service import MetricCalculationService

router = APIRouter(
    prefix="/saas-projects/{project_id}/metric-calculations",
    tags=["Metric Calculations"],
)


@router.get("/latest", response_model=MetricCalculationResponse)
async def calculate_latest_metric_snapshot(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    metric_calculation_service: MetricCalculationService = Depends(get_metric_calculation_service),
):
    return await metric_calculation_service.calculate_latest_for_project(
        project_id=project_id,
        owner_id=current_user.id,
    )


@router.get("/snapshots/{snapshot_id}", response_model=MetricCalculationResponse)
async def calculate_metric_snapshot(
    project_id: UUID,
    snapshot_id: UUID,
    current_user: User = Depends(get_current_user),
    metric_calculation_service: MetricCalculationService = Depends(get_metric_calculation_service),
):
    return await metric_calculation_service.calculate_for_snapshot(
        project_id=project_id,
        snapshot_id=snapshot_id,
        owner_id=current_user.id,
    )
