from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SaasCategory, SaasStage
from app.models.saas_project import SaasProject


class SaasProjectRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_owner(
        self,
        *,
        owner_id: UUID,
        offset: int = 0,
        limit: int = 20,
        stage: SaasStage | None = None,
        category: SaasCategory | None = None,
        search: str | None = None,
    ) -> tuple[list[SaasProject], int]:
        filters = [
            SaasProject.owner_id == owner_id,
            SaasProject.deleted_at.is_(None),
        ]
        if stage is not None:
            filters.append(SaasProject.stage == stage)
        if category is not None:
            filters.append(SaasProject.category == category)
        if search is not None:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    SaasProject.name.ilike(search_pattern),
                    SaasProject.slug.ilike(search_pattern),
                    SaasProject.description.ilike(search_pattern),
                )
            )

        statement = (
            select(SaasProject)
            .where(*filters)
            .order_by(SaasProject.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        count_statement = select(func.count()).select_from(SaasProject).where(*filters)

        result = await self.db.execute(statement)
        total_result = await self.db.execute(count_statement)
        return list(result.scalars().all()), total_result.scalar_one()

    async def count_by_owner(self, *, owner_id: UUID) -> int:
        result = await self.db.execute(
            select(func.count()).select_from(SaasProject).where(
                SaasProject.owner_id == owner_id,
                SaasProject.deleted_at.is_(None),
            )
        )
        return result.scalar_one()

    async def get_by_id_for_owner(self, *, project_id: UUID, owner_id: UUID) -> SaasProject | None:
        result = await self.db.execute(
            select(SaasProject).where(
                SaasProject.id == project_id,
                SaasProject.owner_id == owner_id,
                SaasProject.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def list_all_for_owner(self, *, owner_id: UUID) -> list[SaasProject]:
        result = await self.db.execute(
            select(SaasProject)
            .where(
                SaasProject.owner_id == owner_id,
                SaasProject.deleted_at.is_(None),
            )
            .order_by(SaasProject.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_slug_for_owner(self, *, owner_id: UUID, slug: str) -> SaasProject | None:
        result = await self.db.execute(
            select(SaasProject).where(
                SaasProject.owner_id == owner_id,
                SaasProject.slug == slug,
                SaasProject.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def create(self, *, owner_id: UUID, data: dict) -> SaasProject:
        project = SaasProject(owner_id=owner_id, **data)
        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def update(self, *, project: SaasProject, data: dict) -> SaasProject:
        for field, value in data.items():
            setattr(project, field, value)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def soft_delete(self, *, project: SaasProject) -> SaasProject:
        from datetime import datetime, timezone

        project.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(project)
        return project
