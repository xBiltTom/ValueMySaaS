import re
import unicodedata
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import SaasCategory, SaasStage
from app.models.saas_project import SaasProject
from app.repositories.saas_project_repository import SaasProjectRepository
from app.schemas.saas_project import SaasProjectCreate, SaasProjectListResponse, SaasProjectUpdate


class SaasProjectService:
    def __init__(self, project_repository: SaasProjectRepository) -> None:
        self.project_repository = project_repository

    async def list_projects(
        self,
        *,
        owner_id: UUID,
        offset: int = 0,
        limit: int = 20,
        stage: SaasStage | None = None,
        category: SaasCategory | None = None,
        search: str | None = None,
    ) -> SaasProjectListResponse:
        items, total = await self.project_repository.list_by_owner(
            owner_id=owner_id,
            offset=offset,
            limit=limit,
            stage=stage,
            category=category,
            search=search,
        )
        return SaasProjectListResponse(items=items, total=total, limit=limit, offset=offset)

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
        data["slug"] = self._slugify(data["slug"] or data["name"])
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
            data["slug"] = self._slugify(data["slug"])
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

    def _slugify(self, value: str) -> str:
        normalized = unicodedata.normalize("NFKD", value)
        ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
        slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.lower()).strip("-")
        slug = re.sub(r"-{2,}", "-", slug)
        return slug or "saas-project"
