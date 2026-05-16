from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import SaasCategory, SaasStage
from app.models.saas_project import SaasProject
from app.repositories.saas_project_repository import SaasProjectRepository
from app.schemas.saas_project import SaasProjectCreate, SaasProjectUpdate


class SaasProjectService:
    def __init__(self, project_repository: SaasProjectRepository) -> None:
        self.project_repository = project_repository

    async def list_projects(
        self,
        *,
        owner_id: UUID,
        skip: int = 0,
        limit: int = 50,
        stage: SaasStage | None = None,
        category: SaasCategory | None = None,
    ) -> list[SaasProject]:
        return await self.project_repository.list_by_owner(
            owner_id=owner_id,
            skip=skip,
            limit=limit,
            stage=stage,
            category=category,
        )

    async def get_project(self, *, project_id: UUID, owner_id: UUID) -> SaasProject:
        project = await self.project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SaaS project not found",
            )
        return project

    async def create_project(self, *, owner_id: UUID, payload: SaasProjectCreate) -> SaasProject:
        data = payload.model_dump()
        data["slug"] = data["slug"].lower()
        data["currency"] = data["currency"].upper()

        await self._ensure_slug_available(owner_id=owner_id, slug=data["slug"])
        return await self.project_repository.create(owner_id=owner_id, data=data)

    async def update_project(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
        payload: SaasProjectUpdate,
    ) -> SaasProject:
        project = await self.get_project(project_id=project_id, owner_id=owner_id)
        data = payload.model_dump(exclude_unset=True)

        if "slug" in data and data["slug"] is not None:
            data["slug"] = data["slug"].lower()
            await self._ensure_slug_available(
                owner_id=owner_id,
                slug=data["slug"],
                exclude_project_id=project_id,
            )

        if "currency" in data and data["currency"] is not None:
            data["currency"] = data["currency"].upper()

        return await self.project_repository.update(project=project, data=data)

    async def delete_project(self, *, project_id: UUID, owner_id: UUID) -> None:
        project = await self.get_project(project_id=project_id, owner_id=owner_id)
        await self.project_repository.soft_delete(project=project)

    async def _ensure_slug_available(
        self,
        *,
        owner_id: UUID,
        slug: str,
        exclude_project_id: UUID | None = None,
    ) -> None:
        existing_project = await self.project_repository.get_by_slug_for_owner(
            owner_id=owner_id,
            slug=slug,
        )
        if existing_project is not None and existing_project.id != exclude_project_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Project slug is already used by this user",
            )
