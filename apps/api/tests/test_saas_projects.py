import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_saas_project_service
from app.main import app
from app.models.enums import SaasStage, UserRole


class FakeUser:
    def __init__(self) -> None:
        self.id = uuid.uuid4()
        self.email = "founder@example.com"
        self.username = "founder"
        self.full_name = "Founder"
        self.role = UserRole.USER
        self.is_active = True
        self.is_verified = False
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at
        self.deleted_at = None


class FakeProject:
    def __init__(
        self,
        *,
        owner_id: uuid.UUID,
        name: str,
        slug: str,
        stage: SaasStage = SaasStage.IDEA,
    ) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.owner_id = owner_id
        self.name = name
        self.slug = slug
        self.description = None
        self.category = None
        self.stage = stage
        self.business_model = None
        self.target_market = None
        self.target_audience = None
        self.country_focus = None
        self.main_problem = None
        self.value_proposition = None
        self.pricing_notes = None
        self.current_price = None
        self.currency = "USD"
        self.is_public_sample = False
        self.created_at = now
        self.updated_at = now
        self.deleted_at = None


class FakeSaasProjectService:
    def __init__(self) -> None:
        self.projects: dict[uuid.UUID, FakeProject] = {}

    def _slugify(self, value: str) -> str:
        import re
        import unicodedata

        normalized = unicodedata.normalize("NFKD", value)
        ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
        slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.lower()).strip("-")
        slug = re.sub(r"-{2,}", "-", slug)
        return slug or "saas-project"

    async def list_projects(self, *, owner_id, offset=0, limit=20, search=None, stage=None, category=None):
        projects = [
            project
            for project in self.projects.values()
            if project.owner_id == owner_id and project.deleted_at is None
        ]
        if stage is not None:
            projects = [project for project in projects if project.stage == stage]
        if search is not None:
            search_value = search.lower()
            projects = [
                project
                for project in projects
                if search_value in project.name.lower()
                or search_value in project.slug.lower()
                or (project.description is not None and search_value in project.description.lower())
            ]
        projects.sort(key=lambda project: project.created_at, reverse=True)
        return {
            "items": projects[offset : offset + limit],
            "total": len(projects),
            "limit": limit,
            "offset": offset,
        }

    async def create_project(self, *, owner_id, payload):
        slug = self._slugify(payload.slug or payload.name)
        if any(
            project.owner_id == owner_id
            and project.slug == slug
            and project.deleted_at is None
            for project in self.projects.values()
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Project slug is already used by this user",
            )
        project = FakeProject(
            owner_id=owner_id,
            name=payload.name,
            slug=slug,
            stage=payload.stage,
        )
        project.description = payload.description
        project.current_price = payload.current_price
        project.currency = payload.currency.upper()
        self.projects[project.id] = project
        return project

    async def get_project(self, *, project_id, owner_id):
        project = self.projects.get(project_id)
        if project is None or project.owner_id != owner_id or project.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="SaaS project not found",
            )
        return project

    async def update_project(self, *, project_id, owner_id, payload):
        project = await self.get_project(project_id=project_id, owner_id=owner_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            if field == "slug" and value is not None:
                value = self._slugify(value)
            if field == "currency" and value is not None:
                value = value.upper()
            setattr(project, field, value)
        project.updated_at = datetime.now(timezone.utc)
        return project

    async def delete_project(self, *, project_id, owner_id):
        project = await self.get_project(project_id=project_id, owner_id=owner_id)
        project.deleted_at = datetime.now(timezone.utc)


def build_client(fake_user: FakeUser, fake_service: FakeSaasProjectService) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_saas_project_service] = lambda: fake_service
    return TestClient(app)


def test_saas_projects_require_auth():
    client = TestClient(app)

    response = client.get("/api/v1/saas-projects")

    assert response.status_code == 401


def test_create_saas_project():
    fake_user = FakeUser()
    fake_service = FakeSaasProjectService()
    client = build_client(fake_user, fake_service)

    response = client.post(
        "/api/v1/saas-projects",
        json={
            "name": "Micro CRM",
            "slug": "micro-crm",
            "stage": "MVP",
            "description": "A tiny CRM for indie sellers",
            "current_price": "19.90",
            "currency": "usd",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Micro CRM"
    assert data["slug"] == "micro-crm"
    assert data["stage"] == "MVP"
    assert data["currency"] == "USD"
    assert Decimal(data["current_price"]) == Decimal("19.90")


def test_create_saas_project_generates_slug_when_missing():
    fake_user = FakeUser()
    fake_service = FakeSaasProjectService()
    client = build_client(fake_user, fake_service)

    response = client.post(
        "/api/v1/saas-projects",
        json={
            "name": "Mi S\u00faper SaaS IA!",
            "description": "Proyecto con slug autom\u00e1tico",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "mi-super-saas-ia"


def test_create_saas_project_normalizes_custom_slug():
    fake_user = FakeUser()
    fake_service = FakeSaasProjectService()
    client = build_client(fake_user, fake_service)

    response = client.post(
        "/api/v1/saas-projects",
        json={"name": "CRM Pro", "slug": "   CRM+++Pro   "},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["slug"] == "crm-pro"


def test_list_saas_projects_returns_paginated_response():
    fake_user = FakeUser()
    fake_service = FakeSaasProjectService()
    client = build_client(fake_user, fake_service)
    client.post("/api/v1/saas-projects", json={"name": "One", "slug": "one"})
    client.post("/api/v1/saas-projects", json={"name": "Two", "slug": "two", "stage": "MVP"})

    response = client.get("/api/v1/saas-projects?stage=MVP")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["limit"] == 20
    assert data["offset"] == 0
    assert len(data["items"]) == 1
    assert data["items"][0]["slug"] == "two"


def test_list_saas_projects_supports_offset_limit_and_search():
    fake_user = FakeUser()
    fake_service = FakeSaasProjectService()
    client = build_client(fake_user, fake_service)
    client.post(
        "/api/v1/saas-projects",
        json={"name": "StudyFlow AI", "description": "Productividad para estudiantes"},
    )
    client.post(
        "/api/v1/saas-projects",
        json={"name": "CRM Pro", "description": "Herramienta de ventas"},
    )
    client.post(
        "/api/v1/saas-projects",
        json={"name": "Analytics Hub", "description": "Dashboards y funnels"},
    )

    response = client.get("/api/v1/saas-projects?search=crm&offset=0&limit=1")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["limit"] == 1
    assert data["offset"] == 0
    assert len(data["items"]) == 1
    assert data["items"][0]["slug"] == "crm-pro"


def test_get_update_and_delete_saas_project():
    fake_user = FakeUser()
    fake_service = FakeSaasProjectService()
    client = build_client(fake_user, fake_service)
    create_response = client.post(
        "/api/v1/saas-projects",
        json={"name": "Micro CRM", "slug": "micro-crm"},
    )
    project_id = create_response.json()["id"]

    get_response = client.get(f"/api/v1/saas-projects/{project_id}")
    update_response = client.patch(
        f"/api/v1/saas-projects/{project_id}",
        json={"name": "Micro CRM Pro", "stage": "LAUNCHED"},
    )
    delete_response = client.delete(f"/api/v1/saas-projects/{project_id}")
    after_delete_response = client.get(f"/api/v1/saas-projects/{project_id}")

    app.dependency_overrides.clear()

    assert get_response.status_code == 200
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Micro CRM Pro"
    assert update_response.json()["stage"] == "LAUNCHED"
    assert delete_response.status_code == 204
    assert after_delete_response.status_code == 404


def test_create_saas_project_rejects_duplicate_slug_for_owner():
    fake_user = FakeUser()
    fake_service = FakeSaasProjectService()
    client = build_client(fake_user, fake_service)

    first_response = client.post(
        "/api/v1/saas-projects",
        json={"name": "Micro CRM", "slug": "micro-crm"},
    )
    second_response = client.post(
        "/api/v1/saas-projects",
        json={"name": "Another CRM", "slug": "micro-crm"},
    )

    app.dependency_overrides.clear()

    assert first_response.status_code == 201
    assert second_response.status_code == 409
