from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.saas_score import SaasScore


class SaasScoreRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, *, data: dict) -> SaasScore:
        score = SaasScore(**data)
        self.db.add(score)
        await self.db.flush()
        await self.db.refresh(score)
        return score

    async def list_by_project(
        self,
        *,
        saas_project_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> list[SaasScore]:
        result = await self.db.execute(
            select(SaasScore)
            .where(SaasScore.saas_project_id == saas_project_id)
            .order_by(SaasScore.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_by_project(self, *, saas_project_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(SaasScore).where(SaasScore.saas_project_id == saas_project_id)
        )
        return result.scalar_one()

    async def get_by_id_for_project(
        self,
        *,
        score_id: UUID,
        saas_project_id: UUID,
    ) -> SaasScore | None:
        result = await self.db.execute(
            select(SaasScore).where(
                SaasScore.id == score_id,
                SaasScore.saas_project_id == saas_project_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_latest_by_project(self, *, saas_project_id: UUID) -> SaasScore | None:
        result = await self.db.execute(
            select(SaasScore)
            .where(SaasScore.saas_project_id == saas_project_id)
            .order_by(SaasScore.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_recent_by_project(
        self,
        *,
        saas_project_id: UUID,
        limit: int = 12,
        ascending: bool = True,
    ) -> list[SaasScore]:
        recent_scores = await self.list_by_project(
            saas_project_id=saas_project_id,
            limit=limit,
            offset=0,
        )
        if ascending:
            recent_scores.reverse()
        return recent_scores
