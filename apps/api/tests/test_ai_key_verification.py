import uuid
from datetime import datetime, timezone

from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from app.api.deps import get_ai_key_service, get_current_user
from app.core.config import settings
from app.core.security import encrypt_api_key
from app.main import app
from app.models.enums import AiProvider, UserRole
from app.services.ai_key_service import AiProviderKeyService
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


class FakeKey:
    def __init__(self, *, user_id, provider=AiProvider.GEMINI, encrypted_api_key=None) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.user_id = user_id
        self.provider = provider
        self.label = "Key"
        self.encrypted_api_key = encrypted_api_key
        self.key_last_four = "1234"
        self.is_active = True
        self.created_at = now
        self.updated_at = now
        self.deleted_at = None


class FakeRepo:
    def __init__(self, key: FakeKey) -> None:
        self.key = key

    async def get_active_by_id_for_user(self, *, key_id, user_id):
        if self.key.id == key_id and self.key.user_id == user_id and self.key.is_active and self.key.deleted_at is None:
            return self.key
        return None

    async def get_by_id_for_user(self, *, key_id, user_id):
        if self.key.id == key_id and self.key.user_id == user_id and self.key.deleted_at is None:
            return self.key
        return None


class FakeLlm:
    async def verify_connection(self, *, provider, api_key, model_name):
        if provider == AiProvider.OTHER and (not model_name or "/" not in model_name):
            from fastapi import HTTPException

            raise HTTPException(status_code=400, detail="model_name with prefix required")
        resolved = "gemini/gemini-1.5-flash" if provider == AiProvider.GEMINI else model_name
        return LlmResponse(output_text="OK", model_name=resolved)


def build_client(fake_user: FakeUser, service: AiProviderKeyService) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_ai_key_service] = lambda: service
    return TestClient(app)


def make_service(user_id, provider=AiProvider.GEMINI):
    settings.ENCRYPTION_KEY = Fernet.generate_key().decode()
    key = FakeKey(user_id=user_id, provider=provider, encrypted_api_key=encrypt_api_key("secret-1234"))
    return key, AiProviderKeyService(FakeRepo(key), FakeLlm())


def test_verify_requires_auth():
    client = TestClient(app)

    response = client.post(f"/api/v1/ai/keys/{uuid.uuid4()}/verify")

    assert response.status_code == 401


def test_verify_own_key_with_fake_llm_returns_ok():
    fake_user = FakeUser()
    key, service = make_service(fake_user.id)
    client = build_client(fake_user, service)

    response = client.post(f"/api/v1/ai/keys/{key.id}/verify", json={"model_name": "gemini-1.5-flash"})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["model_name"] == "gemini/gemini-1.5-flash"
    assert "api_key" not in data
    assert "encrypted_api_key" not in data


def test_verify_foreign_key_returns_404():
    fake_user = FakeUser()
    other_user = FakeUser()
    key, service = make_service(other_user.id)
    client = build_client(fake_user, service)

    response = client.post(f"/api/v1/ai/keys/{key.id}/verify")

    app.dependency_overrides.clear()

    assert response.status_code == 404


def test_verify_other_without_model_prefix_returns_400():
    fake_user = FakeUser()
    key, service = make_service(fake_user.id, provider=AiProvider.OTHER)
    client = build_client(fake_user, service)

    response = client.post(f"/api/v1/ai/keys/{key.id}/verify", json={"model_name": "llama"})

    app.dependency_overrides.clear()

    assert response.status_code == 400
