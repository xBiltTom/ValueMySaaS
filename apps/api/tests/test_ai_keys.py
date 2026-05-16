import uuid
from datetime import datetime, timezone

from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from app.api.deps import get_ai_key_service, get_current_user
from app.core.config import settings
from app.main import app
from app.models.enums import AiProvider, UserRole
from app.services.ai_key_service import AiProviderKeyService


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


class FakeKey:
    def __init__(self, **data) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.created_at = now
        self.updated_at = now
        self.deleted_at = None
        for field, value in data.items():
            setattr(self, field, value)


class FakeAiKeyRepository:
    def __init__(self) -> None:
        self.keys: list[FakeKey] = []

    async def create(self, *, data):
        key = FakeKey(**data)
        self.keys.append(key)
        return key

    async def list_by_user(self, *, user_id, provider=None, active_only=False, limit=20, offset=0):
        keys = [key for key in self.keys if key.user_id == user_id and key.deleted_at is None]
        if provider is not None:
            keys = [key for key in keys if key.provider == provider]
        if active_only:
            keys = [key for key in keys if key.is_active]
        return keys[offset : offset + limit]

    async def count_by_user(self, *, user_id, provider=None, active_only=False):
        return len(await self.list_by_user(user_id=user_id, provider=provider, active_only=active_only))

    async def get_by_id_for_user(self, *, key_id, user_id):
        for key in self.keys:
            if key.id == key_id and key.user_id == user_id and key.deleted_at is None:
                return key
        return None

    async def get_active_by_id_for_user(self, *, key_id, user_id):
        key = await self.get_by_id_for_user(key_id=key_id, user_id=user_id)
        return key if key and key.is_active else None

    async def get_by_user_provider_label(self, *, user_id, provider, label):
        for key in self.keys:
            if key.user_id == user_id and key.provider == provider and key.label == label and key.deleted_at is None:
                return key
        return None

    async def update(self, *, key, data):
        for field, value in data.items():
            setattr(key, field, value)
        key.updated_at = datetime.now(timezone.utc)
        return key

    async def soft_delete(self, *, key):
        key.deleted_at = datetime.now(timezone.utc)
        key.is_active = False


def build_client(fake_user: FakeUser, service: AiProviderKeyService) -> TestClient:
    settings.ENCRYPTION_KEY = Fernet.generate_key().decode()
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_ai_key_service] = lambda: service
    return TestClient(app)


def test_ai_keys_require_auth():
    client = TestClient(app)

    response = client.get("/api/v1/ai/keys")

    assert response.status_code == 401


def test_create_key_returns_safe_metadata_without_secret():
    fake_user = FakeUser()
    service = AiProviderKeyService(FakeAiKeyRepository())
    client = build_client(fake_user, service)

    response = client.post(
        "/api/v1/ai/keys",
        json={"provider": "OPENAI", "label": "Personal", "api_key": "sk-test-1234"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["provider"] == "OPENAI"
    assert data["key_last_four"] == "1234"
    assert "api_key" not in data
    assert "encrypted_api_key" not in data


def test_list_keys_does_not_expose_encrypted_key():
    fake_user = FakeUser()
    service = AiProviderKeyService(FakeAiKeyRepository())
    client = build_client(fake_user, service)
    client.post("/api/v1/ai/keys", json={"provider": "OPENAI", "label": "A", "api_key": "secret-abcd"})

    response = client.get("/api/v1/ai/keys")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["key_last_four"] == "abcd"
    assert "encrypted_api_key" not in item


def test_rotate_key_updates_last_four():
    fake_user = FakeUser()
    service = AiProviderKeyService(FakeAiKeyRepository())
    client = build_client(fake_user, service)
    key_id = client.post(
        "/api/v1/ai/keys",
        json={"provider": "OPENAI", "label": "A", "api_key": "secret-abcd"},
    ).json()["id"]

    response = client.patch(f"/api/v1/ai/keys/{key_id}", json={"api_key": "secret-wxyz"})

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["key_last_four"] == "wxyz"


def test_delete_key_returns_204():
    fake_user = FakeUser()
    service = AiProviderKeyService(FakeAiKeyRepository())
    client = build_client(fake_user, service)
    key_id = client.post(
        "/api/v1/ai/keys",
        json={"provider": "OPENAI", "label": "A", "api_key": "secret-abcd"},
    ).json()["id"]

    response = client.delete(f"/api/v1/ai/keys/{key_id}")

    app.dependency_overrides.clear()

    assert response.status_code == 204
