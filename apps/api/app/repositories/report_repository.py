from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ReportType
from app.models.report import Report


class ReportRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, data: dict) -> Report:
        report = Report(**data)
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def list_by_project(
        self,
        *,
        saas_project_id: UUID,
        limit: int = 20,
        offset: int = 0,
        report_type: ReportType | None = None,
    ) -> list[Report]:
        statement = self._project_query(
            saas_project_id=saas_project_id,
            report_type=report_type,
        )
        statement = statement.order_by(Report.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def count_by_project(
        self,
        *,
        saas_project_id: UUID,
        report_type: ReportType | None = None,
    ) -> int:
        statement = self._project_query(
            saas_project_id=saas_project_id,
            report_type=report_type,
        )
        result = await self.db.execute(select(func.count()).select_from(statement.subquery()))
        return result.scalar_one()

    async def get_by_id_for_project(
        self,
        *,
        report_id: UUID,
        saas_project_id: UUID,
    ) -> Report | None:
        result = await self.db.execute(
            select(Report).where(
                Report.id == report_id,
                Report.saas_project_id == saas_project_id,
            )
        )
        return result.scalar_one_or_none()

    def _project_query(self, *, saas_project_id: UUID, report_type: ReportType | None):
        statement = select(Report).where(Report.saas_project_id == saas_project_id)
        if report_type is not None:
            statement = statement.where(Report.report_type == report_type)
        return statement

    async def delete(self, *, report_id: UUID) -> None:
        result = await self.db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if report:
            await self.db.delete(report)
            await self.db.flush()
