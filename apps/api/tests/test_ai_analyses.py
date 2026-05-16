import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.deps import get_ai_analysis_service, get_current_user
from app.main import app
from app.models.enums import AiAnalysisType, AiProvider, SaasStage, UserRole
from app.services.ai_analysis_service import AiAnalysisService
from app.services.llm_client_service import LlmResponse


class FakeUser:
    def __init__(self) -> None:
        self.id = uuid.uuid4()
        self.role = UserRole.USER
        self.email = "founder@example.com"
        self.username = "founder"
        self.full_name = "Founder"
        self.is_active = True
        self.is_verified = False
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at
        self.deleted_at = None


class FakeProject:
    def __init__(self, *, owner_id: uuid.UUID) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.owner_id = owner_id
        self.name = "StudyFlow AI"
        self.slug = "studyflow-ai"
        self.stage = SaasStage.MVP
        self.category = None
        self.business_model = None
        self.current_price = Decimal("9.99")
        self.currency = "USD"
        self.created_at = now
        self.updated_at = now
        self.deleted_at = None


class FakeKey:
    def __init__(self, *, user_id: uuid.UUID, provider: AiProvider = AiProvider.OPENAI) -> None:
        self.id = uuid.uuid4()
        self.user_id = user_id
        self.provider = provider
        self.is_active = True


class FakeAnalysis:
    def __init__(self, **data) -> None:
        self.id = uuid.uuid4()
        self.created_at = datetime.now(timezone.utc)
        for field, value in data.items():
            setattr(self, field, value)


class FakeAnalysisRepository:
    def __init__(self) -> None:
        self.items: list[FakeAnalysis] = []

    async def create(self, *, data):
        analysis = FakeAnalysis(**data)
        self.items.append(analysis)
        return analysis

    async def list_by_project(self, *, saas_project_id, analysis_type=None, limit=20, offset=0):
        items = [item for item in self.items if item.saas_project_id == saas_project_id]
        if analysis_type is not None:
            items = [item for item in items if item.analysis_type == analysis_type]
        return items[offset : offset + limit]

    async def count_by_project(self, *, saas_project_id, analysis_type=None):
        return len(await self.list_by_project(saas_project_id=saas_project_id, analysis_type=analysis_type))

    async def get_by_id_for_project(self, *, analysis_id, saas_project_id):
        for item in self.items:
            if item.id == analysis_id and item.saas_project_id == saas_project_id:
                return item
        return None


class FakeKeyService:
    def __init__(self, key: FakeKey) -> None:
        self.key = key

    async def get_decrypted_key_for_user(self, *, key_id, user_id):
        if self.key.id == key_id and self.key.user_id == user_id:
            return self.key, "plain-secret"
        return None


class FakeProjectRepository:
    def __init__(self, projects: list[FakeProject]) -> None:
        self.projects = projects

    async def get_by_id_for_owner(self, *, project_id, owner_id):
        for project in self.projects:
            if project.id == project_id and project.owner_id == owner_id:
                return project
        return None


class FakeSnapshotRepository:
    async def get_latest_by_project(self, *, saas_project_id):
        return None


class FakeScoreRepository:
    async def get_latest_by_project(self, *, saas_project_id):
        return None


class FakeContextService:
    async def build_context(self, *, project_id, owner_id):
        return {
            "project": {"id": str(project_id), "name": "StudyFlow AI"},
            "data_quality": {"has_snapshot": False, "has_score": False, "limitations": ["Sin datos"]},
        }


class FakeLlmClient:
    async def generate_analysis(self, *, provider, api_key, model_name, system_prompt, user_prompt):
        return LlmResponse(
            output_text="Analisis generado con contexto estructurado.",
            output_json=None,
            tokens_input=10,
            tokens_output=20,
            estimated_cost=None,
            model_name=model_name or "gpt-4o-mini",
        )


class ResolvingFakeLlmClient:
    def __init__(self) -> None:
        from app.services.llm_client_service import LlmClientService

        self.client = LlmClientService()

    async def generate_analysis(self, *, provider, api_key, model_name, system_prompt, user_prompt):
        resolved_model = self.client._resolve_litellm_model(provider=provider, model_name=model_name)
        return LlmResponse(
            output_text="Analisis generado con modelo resuelto.",
            output_json=None,
            tokens_input=10,
            tokens_output=20,
            estimated_cost=None,
            model_name=resolved_model,
        )


def build_service(fake_user: FakeUser, project: FakeProject, key: FakeKey) -> AiAnalysisService:
    return AiAnalysisService(
        FakeAnalysisRepository(),
        FakeKeyService(key),
        FakeProjectRepository([project]),
        FakeSnapshotRepository(),
        FakeScoreRepository(),
        FakeContextService(),
        FakeLlmClient(),
    )


def build_resolving_service(fake_user: FakeUser, project: FakeProject, key: FakeKey) -> AiAnalysisService:
    return AiAnalysisService(
        FakeAnalysisRepository(),
        FakeKeyService(key),
        FakeProjectRepository([project]),
        FakeSnapshotRepository(),
        FakeScoreRepository(),
        FakeContextService(),
        ResolvingFakeLlmClient(),
    )


def build_client(fake_user: FakeUser, service: AiAnalysisService) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_ai_analysis_service] = lambda: service
    return TestClient(app)


def test_ai_analyses_require_auth():
    client = TestClient(app)
    project_id = uuid.uuid4()

    response = client.get(f"/api/v1/saas-projects/{project_id}/ai-analyses")

    assert response.status_code == 401


def test_custom_without_question_returns_400():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    key = FakeKey(user_id=fake_user.id)
    client = build_client(fake_user, build_service(fake_user, project, key))

    response = client.post(
        f"/api/v1/saas-projects/{project.id}/ai-analyses",
        json={"ai_key_id": str(key.id), "analysis_type": "CUSTOM"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400


def test_generate_analysis_with_fake_llm_persists_metadata():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    key = FakeKey(user_id=fake_user.id)
    client = build_client(fake_user, build_service(fake_user, project, key))

    response = client.post(
        f"/api/v1/saas-projects/{project.id}/ai-analyses",
        json={"ai_key_id": str(key.id), "analysis_type": "FULL_DIAGNOSIS", "model_name": "gpt-test"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["provider"] == "OPENAI"
    assert data["model_name"] == "gpt-test"
    assert data["analysis_type"] == "FULL_DIAGNOSIS"
    assert data["prompt_version"] == "v1"
    assert "API" not in data["output_text"]


def test_list_analyses_returns_paginated_response():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    key = FakeKey(user_id=fake_user.id)
    service = build_service(fake_user, project, key)
    client = build_client(fake_user, service)
    client.post(f"/api/v1/saas-projects/{project.id}/ai-analyses", json={"ai_key_id": str(key.id), "analysis_type": "FULL_DIAGNOSIS"})

    response = client.get(f"/api/v1/saas-projects/{project.id}/ai-analyses?limit=1&offset=0")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["limit"] == 1
    assert data["offset"] == 0
    assert len(data["items"]) == 1


def test_get_analysis_by_id():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    key = FakeKey(user_id=fake_user.id)
    service = build_service(fake_user, project, key)
    client = build_client(fake_user, service)
    created = client.post(f"/api/v1/saas-projects/{project.id}/ai-analyses", json={"ai_key_id": str(key.id), "analysis_type": "FULL_DIAGNOSIS"}).json()

    response = client.get(f"/api/v1/saas-projects/{project.id}/ai-analyses/{created['id']}")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_foreign_project_returns_404():
    fake_user = FakeUser()
    other_user = FakeUser()
    project = FakeProject(owner_id=other_user.id)
    key = FakeKey(user_id=fake_user.id)
    client = build_client(fake_user, build_service(fake_user, project, key))

    response = client.post(
        f"/api/v1/saas-projects/{project.id}/ai-analyses",
        json={"ai_key_id": str(key.id), "analysis_type": "FULL_DIAGNOSIS"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 404


def test_generate_analysis_persists_resolved_model_name():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    key = FakeKey(user_id=fake_user.id, provider=AiProvider.GEMINI)
    client = build_client(fake_user, build_resolving_service(fake_user, project, key))

    response = client.post(
        f"/api/v1/saas-projects/{project.id}/ai-analyses",
        json={
            "ai_key_id": str(key.id),
            "analysis_type": "FULL_DIAGNOSIS",
            "model_name": "gemini-1.5-flash",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["model_name"] == "gemini/gemini-1.5-flash"
