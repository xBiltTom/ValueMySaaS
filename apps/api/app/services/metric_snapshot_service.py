from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from app.models.saas_metric_snapshot import SaasMetricSnapshot
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.schemas.metric_snapshot import (
    MetricSnapshotCreate,
    MetricSnapshotListResponse,
    MetricSnapshotUpdate,
)


class MetricSnapshotService:
    def __init__(
        self,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_project_repository: SaasProjectRepository,
    ) -> None:
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_project_repository = saas_project_repository

    async def create_snapshot(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        payload: MetricSnapshotCreate,
    ) -> SaasMetricSnapshot:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        data = payload.model_dump(exclude_unset=True)
        data["captured_at"] = self._normalize_captured_at(data.get("captured_at"))
        return await self.metric_snapshot_repository.create(saas_project_id=project_id, data=data)

    async def list_snapshots(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        limit: int = 20,
        offset: int = 0,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> MetricSnapshotListResponse:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        normalized_from = self._normalize_optional_datetime(from_date)
        normalized_to = self._normalize_optional_datetime(to_date)
        items = await self.metric_snapshot_repository.list_by_project(
            saas_project_id=project_id,
            limit=limit,
            offset=offset,
            from_date=normalized_from,
            to_date=normalized_to,
        )
        total = await self.metric_snapshot_repository.count_by_project(
            saas_project_id=project_id,
            from_date=normalized_from,
            to_date=normalized_to,
        )
        return MetricSnapshotListResponse(items=items, total=total, limit=limit, offset=offset)

    async def get_snapshot(
        self,
        *,
        project_id: UUID,
        snapshot_id: UUID,
        owner_id: UUID,
    ) -> SaasMetricSnapshot:
        await self._ensure_project_owned(project_id=project_id, owner_id=owner_id)
        snapshot = await self.metric_snapshot_repository.get_by_id_for_project(
            snapshot_id=snapshot_id,
            saas_project_id=project_id,
        )
        if snapshot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Metric snapshot not found",
            )
        return snapshot

    async def update_snapshot(
        self,
        *,
        project_id: UUID,
        snapshot_id: UUID,
        owner_id: UUID,
        payload: MetricSnapshotUpdate,
    ) -> SaasMetricSnapshot:
        snapshot = await self.get_snapshot(
            project_id=project_id,
            snapshot_id=snapshot_id,
            owner_id=owner_id,
        )
        data = payload.model_dump(exclude_unset=True)
        if "captured_at" in data:
            data["captured_at"] = self._normalize_captured_at(data["captured_at"])
        return await self.metric_snapshot_repository.update(snapshot=snapshot, data=data)

    async def delete_snapshot(
        self,
        *,
        project_id: UUID,
        snapshot_id: UUID,
        owner_id: UUID,
    ) -> None:
        snapshot = await self.get_snapshot(
            project_id=project_id,
            snapshot_id=snapshot_id,
            owner_id=owner_id,
        )
        await self.metric_snapshot_repository.delete(snapshot=snapshot)

    async def _ensure_project_owned(self, *, project_id: UUID, owner_id: UUID) -> None:
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SaaS project not found",
            )

    def _normalize_captured_at(self, value: datetime | None) -> datetime:
        if value is None:
            return datetime.now(timezone.utc)
        return self._normalize_optional_datetime(value)

    def _normalize_optional_datetime(self, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value
