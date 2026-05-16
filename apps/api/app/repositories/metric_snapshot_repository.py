from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saas_metric_snapshot import SaasMetricSnapshot


class MetricSnapshotRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, saas_project_id: UUID, data: dict) -> SaasMetricSnapshot:
        snapshot = SaasMetricSnapshot(saas_project_id=saas_project_id, **data)
        self.db.add(snapshot)
        await self.db.flush()
        await self.db.refresh(snapshot)
        return snapshot

    async def list_by_project(
        self,
        *,
        saas_project_id: UUID,
        limit: int = 20,
        offset: int = 0,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> list[SaasMetricSnapshot]:
        statement = self._build_project_query(
            saas_project_id=saas_project_id,
            from_date=from_date,
            to_date=to_date,
        )
        statement = statement.order_by(SaasMetricSnapshot.captured_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def count_by_project(
        self,
        *,
        saas_project_id: UUID,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> int:
        statement = self._build_project_query(
            saas_project_id=saas_project_id,
            from_date=from_date,
            to_date=to_date,
        )
        count_statement = select(func.count()).select_from(statement.subquery())
        result = await self.db.execute(count_statement)
        return result.scalar_one()

    async def get_by_id_for_project(
        self,
        *,
        snapshot_id: UUID,
        saas_project_id: UUID,
    ) -> SaasMetricSnapshot | None:
        result = await self.db.execute(
            select(SaasMetricSnapshot).where(
                SaasMetricSnapshot.id == snapshot_id,
                SaasMetricSnapshot.saas_project_id == saas_project_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_latest_by_project(
        self,
        *,
        saas_project_id: UUID,
    ) -> SaasMetricSnapshot | None:
        result = await self.db.execute(
            select(SaasMetricSnapshot)
            .where(SaasMetricSnapshot.saas_project_id == saas_project_id)
            .order_by(SaasMetricSnapshot.captured_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_previous_snapshot(
        self,
        *,
        saas_project_id: UUID,
        captured_at: datetime,
    ) -> SaasMetricSnapshot | None:
        result = await self.db.execute(
            select(SaasMetricSnapshot)
            .where(
                SaasMetricSnapshot.saas_project_id == saas_project_id,
                SaasMetricSnapshot.captured_at < captured_at,
            )
            .order_by(SaasMetricSnapshot.captured_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_recent_by_project(
        self,
        *,
        saas_project_id: UUID,
        limit: int = 12,
        ascending: bool = True,
    ) -> list[SaasMetricSnapshot]:
        result = await self.db.execute(
            select(SaasMetricSnapshot)
            .where(SaasMetricSnapshot.saas_project_id == saas_project_id)
            .order_by(SaasMetricSnapshot.captured_at.desc())
            .limit(limit)
        )
        snapshots = list(result.scalars().all())
        if ascending:
            snapshots.reverse()
        return snapshots

    async def update(
        self,
        *,
        snapshot: SaasMetricSnapshot,
        data: dict,
    ) -> SaasMetricSnapshot:
        for field, value in data.items():
            setattr(snapshot, field, value)
        await self.db.flush()
        await self.db.refresh(snapshot)
        return snapshot

    async def delete(self, *, snapshot: SaasMetricSnapshot) -> None:
        await self.db.delete(snapshot)
        await self.db.flush()

    def _build_project_query(
        self,
        *,
        saas_project_id: UUID,
        from_date: datetime | None,
        to_date: datetime | None,
    ):
        statement = select(SaasMetricSnapshot).where(
            SaasMetricSnapshot.saas_project_id == saas_project_id
        )
        if from_date is not None:
            statement = statement.where(SaasMetricSnapshot.captured_at >= from_date)
        if to_date is not None:
            statement = statement.where(SaasMetricSnapshot.captured_at <= to_date)
        return statement
