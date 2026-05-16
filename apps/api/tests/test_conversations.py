import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.api.deps import get_conversation_service, get_current_user
from app.main import app
from app.models.enums import ConversationStatus, UserRole
from app.services.conversation_service import ConversationService


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
    def __init__(self, *, owner_id) -> None:
        self.id = uuid.uuid4()
        self.owner_id = owner_id
        self.name = "StudyFlow AI"
        self.deleted_at = None


class FakeConversation:
    def __init__(self, **data) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.provider = None
        self.model_name = None
        self.created_at = now
        self.updated_at = now
        self.deleted_at = None
        for field, value in data.items():
            setattr(self, field, value)


class FakeProjectRepo:
    def __init__(self, project) -> None:
        self.project = project

    async def get_by_id_for_owner(self, *, project_id, owner_id):
        if self.project.id == project_id and self.project.owner_id == owner_id:
            return self.project
        return None


class FakeConversationRepo:
    def __init__(self) -> None:
        self.items = []

    async def create(self, *, data):
        item = FakeConversation(**data)
        self.items.append(item)
        return item

    async def list_by_project_user(self, *, saas_project_id, user_id, status=None, include_deleted=False, limit=20, offset=0):
        items = [item for item in self.items if item.saas_project_id == saas_project_id and item.user_id == user_id]
        if status is not None:
            items = [item for item in items if item.status == status]
        elif not include_deleted:
            items = [item for item in items if item.status != ConversationStatus.DELETED]
        return items[offset : offset + limit]

    async def count_by_project_user(self, **kwargs):
        return len(await self.list_by_project_user(**kwargs))

    async def get_by_id_for_project_user(self, *, conversation_id, saas_project_id, user_id, include_deleted=False):
        for item in self.items:
            if item.id == conversation_id and item.saas_project_id == saas_project_id and item.user_id == user_id:
                if item.status == ConversationStatus.DELETED and not include_deleted:
                    return None
                return item
        return None

    async def update(self, *, conversation, data):
        for field, value in data.items():
            setattr(conversation, field, value)
        conversation.updated_at = datetime.now(timezone.utc)
        return conversation

    async def soft_delete(self, *, conversation):
        conversation.status = ConversationStatus.DELETED
        conversation.deleted_at = datetime.now(timezone.utc)


def build_client(fake_user, service):
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_conversation_service] = lambda: service
    return TestClient(app)


def test_conversation_crud_and_soft_delete():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    service = ConversationService(FakeProjectRepo(project), FakeConversationRepo())
    client = build_client(fake_user, service)

    created = client.post(f"/api/v1/saas-projects/{project.id}/conversations", json={"title": "Diagnostico"}).json()
    listed = client.get(f"/api/v1/saas-projects/{project.id}/conversations").json()
    got = client.get(f"/api/v1/saas-projects/{project.id}/conversations/{created['id']}").json()
    updated = client.patch(
        f"/api/v1/saas-projects/{project.id}/conversations/{created['id']}",
        json={"title": "Nuevo titulo"},
    ).json()
    deleted = client.delete(f"/api/v1/saas-projects/{project.id}/conversations/{created['id']}")
    after_delete = client.get(f"/api/v1/saas-projects/{project.id}/conversations").json()

    app.dependency_overrides.clear()

    assert listed["total"] == 1
    assert got["id"] == created["id"]
    assert updated["title"] == "Nuevo titulo"
    assert deleted.status_code == 204
    assert after_delete["total"] == 0
