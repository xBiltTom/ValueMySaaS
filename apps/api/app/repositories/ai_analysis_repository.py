from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_analysis import AiAnalysis
from app.models.enums import AiAnalysisType


class AiAnalysisRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, data: dict) -> AiAnalysis:
        analysis = AiAnalysis(**data)
        self.db.add(analysis)
        await self.db.flush()
        await self.db.refresh(analysis)
        return analysis

    async def list_by_project(
        self,
        *,
        saas_project_id: UUID,
        analysis_type: AiAnalysisType | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> list[AiAnalysis]:
        statement = self._project_query(saas_project_id=saas_project_id, analysis_type=analysis_type)
        statement = statement.order_by(AiAnalysis.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(statement)
        return list(result.scalars().all())

    async def count_by_project(
        self,
        *,
        saas_project_id: UUID,
        analysis_type: AiAnalysisType | None = None,
    ) -> int:
        statement = self._project_query(saas_project_id=saas_project_id, analysis_type=analysis_type)
        result = await self.db.execute(select(func.count()).select_from(statement.subquery()))
        return result.scalar_one()

    async def get_by_id_for_project(
        self,
        *,
        analysis_id: UUID,
        saas_project_id: UUID,
    ) -> AiAnalysis | None:
        result = await self.db.execute(
            select(AiAnalysis).where(
                AiAnalysis.id == analysis_id,
                AiAnalysis.saas_project_id == saas_project_id,
            )
        )
        return result.scalar_one_or_none()

    def _project_query(self, *, saas_project_id: UUID, analysis_type: AiAnalysisType | None):
        statement = select(AiAnalysis).where(AiAnalysis.saas_project_id == saas_project_id)
        if analysis_type is not None:
            statement = statement.where(AiAnalysis.analysis_type == analysis_type)
        return statement

    async def count_total(self) -> int:
        """Total de análisis en el sistema. Usado por el admin para estadísticas."""
        result = await self.db.execute(
            select(func.count()).select_from(AiAnalysis)
        )
        return result.scalar_one()

