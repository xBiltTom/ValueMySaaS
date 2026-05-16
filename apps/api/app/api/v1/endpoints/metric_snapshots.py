from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_current_user, get_metric_snapshot_service
from app.models.user import User
from app.schemas.metric_snapshot import (
    MetricSnapshotCreate,
    MetricSnapshotListResponse,
    MetricSnapshotRead,
    MetricSnapshotUpdate,
)
from app.services.metric_snapshot_service import MetricSnapshotService

router = APIRouter(
    prefix="/saas-projects/{project_id}/metric-snapshots",
    tags=["Metric Snapshots"],
)


@router.post("", response_model=MetricSnapshotRead, status_code=status.HTTP_201_CREATED)
async def create_metric_snapshot(
    project_id: UUID,
    payload: MetricSnapshotCreate,
    current_user: User = Depends(get_current_user),
    metric_snapshot_service: MetricSnapshotService = Depends(get_metric_snapshot_service),
):
    return await metric_snapshot_service.create_snapshot(
        project_id=project_id,
        owner_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=MetricSnapshotListResponse)
async def list_metric_snapshots(
    project_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    from_date: datetime | None = Query(default=None),
    to_date: datetime | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    metric_snapshot_service: MetricSnapshotService = Depends(get_metric_snapshot_service),
):
    return await metric_snapshot_service.list_snapshots(
        project_id=project_id,
        owner_id=current_user.id,
        limit=limit,
        offset=offset,
        from_date=from_date,
        to_date=to_date,
    )


@router.get("/{snapshot_id}", response_model=MetricSnapshotRead)
async def get_metric_snapshot(
    project_id: UUID,
    snapshot_id: UUID,
    current_user: User = Depends(get_current_user),
    metric_snapshot_service: MetricSnapshotService = Depends(get_metric_snapshot_service),
):
    return await metric_snapshot_service.get_snapshot(
        project_id=project_id,
        snapshot_id=snapshot_id,
        owner_id=current_user.id,
    )


@router.patch("/{snapshot_id}", response_model=MetricSnapshotRead)
async def update_metric_snapshot(
    project_id: UUID,
    snapshot_id: UUID,
    payload: MetricSnapshotUpdate,
    current_user: User = Depends(get_current_user),
    metric_snapshot_service: MetricSnapshotService = Depends(get_metric_snapshot_service),
):
    return await metric_snapshot_service.update_snapshot(
        project_id=project_id,
        snapshot_id=snapshot_id,
        owner_id=current_user.id,
        payload=payload,
    )


@router.delete("/{snapshot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_metric_snapshot(
    project_id: UUID,
    snapshot_id: UUID,
    current_user: User = Depends(get_current_user),
    metric_snapshot_service: MetricSnapshotService = Depends(get_metric_snapshot_service),
) -> Response:
    await metric_snapshot_service.delete_snapshot(
        project_id=project_id,
        snapshot_id=snapshot_id,
        owner_id=current_user.id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
