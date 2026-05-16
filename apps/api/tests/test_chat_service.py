import uuid
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.api.deps import get_chat_service, get_current_user
from app.main import app
from app.models.enums import AiProvider, ChatRole, ConversationStatus, UserRole
from app.services.chat_service import ChatService
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
    def __init__(self, *, owner_id):
        self.id = uuid.uuid4()
        self.owner_id = owner_id
        self.deleted_at = None


class FakeConversation:
    def __init__(self, *, project_id, user_id, status=ConversationStatus.ACTIVE):
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.saas_project_id = project_id
        self.user_id = user_id
        self.title = "Chat"
        self.provider = None
        self.model_name = None
        self.system_prompt_version = "v1"
        self.status = status
        self.created_at = now
        self.updated_at = now
        self.deleted_at = None


class FakeMessage:
    def __init__(self, **data):
        self.id = uuid.uuid4()
        self.created_at = datetime.now(timezone.utc)
        self.token_count = None
        for field, value in data.items():
            setattr(self, field, value)


class FakeProjectRepo:
    def __init__(self, project):
        self.project = project

    async def get_by_id_for_owner(self, *, project_id, owner_id):
        if self.project.id == project_id and self.project.owner_id == owner_id:
            return self.project
        return None


class FakeConversationRepo:
    def __init__(self, conversation):
        self.conversation = conversation

    async def get_by_id_for_project_user(self, *, conversation_id, saas_project_id, user_id, include_deleted=False):
        if (
            self.conversation.id == conversation_id
            and self.conversation.saas_project_id == saas_project_id
            and self.conversation.user_id == user_id
        ):
            return self.conversation
        return None

    async def update(self, *, conversation, data):
        for field, value in data.items():
            setattr(conversation, field, value)
        conversation.updated_at = datetime.now(timezone.utc)
        return conversation


class FakeMessageRepo:
    def __init__(self):
        self.messages = []

    async def create(self, *, data):
        message = FakeMessage(**data)
        self.messages.append(message)
        return message

    async def list_by_conversation(self, *, conversation_id, limit=50, offset=0):
        return [m for m in self.messages if m.conversation_id == conversation_id][offset : offset + limit]

    async def count_by_conversation(self, *, conversation_id):
        return len([m for m in self.messages if m.conversation_id == conversation_id])

    async def list_recent_by_conversation(self, *, conversation_id, limit=10):
        return [m for m in self.messages if m.conversation_id == conversation_id][-limit:]


class FakeKey:
    def __init__(self, user_id):
        self.id = uuid.uuid4()
        self.user_id = user_id
        self.provider = AiProvider.OTHER


class FakeKeyService:
    def __init__(self, key):
        self.key = key

    async def get_decrypted_key_for_user(self, *, key_id, user_id):
        if self.key.id == key_id and self.key.user_id == user_id:
            return self.key, "secret"
        return None


class FakeContextService:
    async def build_context(self, *, project_id, owner_id):
        return {"project": {"id": str(project_id)}, "data_quality": {"limitations": []}}


class FakeLlm:
    async def generate_analysis(self, *, provider, api_key, model_name, system_prompt, user_prompt):
        return LlmResponse(
            output_text="Tu churn debe revisarse con prioridad.",
            tokens_input=10,
            tokens_output=8,
            model_name=model_name,
        )


def build_service(fake_user, project, conversation, key, message_repo=None):
    return ChatService(
        FakeProjectRepo(project),
        FakeConversationRepo(conversation),
        message_repo or FakeMessageRepo(),
        FakeKeyService(key),
        FakeContextService(),
        FakeLlm(),
    )


def build_client(fake_user, service):
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_chat_service] = lambda: service
    return TestClient(app)


def test_send_message_requires_auth():
    client = TestClient(app)

    response = client.post(
        f"/api/v1/saas-projects/{uuid.uuid4()}/conversations/{uuid.uuid4()}/messages",
        json={"ai_key_id": str(uuid.uuid4()), "message": "Hola"},
    )

    assert response.status_code == 401


def test_send_message_saves_user_and_assistant():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    conversation = FakeConversation(project_id=project.id, user_id=fake_user.id)
    key = FakeKey(fake_user.id)
    message_repo = FakeMessageRepo()
    client = build_client(fake_user, build_service(fake_user, project, conversation, key, message_repo))

    response = client.post(
        f"/api/v1/saas-projects/{project.id}/conversations/{conversation.id}/messages",
        json={
            "ai_key_id": str(key.id),
            "model_name": "groq/llama-3.1-8b-instant",
            "message": "Que significa mi churn?",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == str(conversation.id)
    assert data["provider"] == "OTHER"
    assert data["model_name"] == "groq/llama-3.1-8b-instant"
    assert data["user_message"]["role"] == "USER"
    assert data["assistant_message"]["role"] == "ASSISTANT"
    assert len(message_repo.messages) == 2
    assert message_repo.messages[0].role == ChatRole.USER
    assert message_repo.messages[1].role == ChatRole.ASSISTANT


def test_inactive_conversation_returns_400():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    conversation = FakeConversation(project_id=project.id, user_id=fake_user.id, status=ConversationStatus.ARCHIVED)
    key = FakeKey(fake_user.id)
    client = build_client(fake_user, build_service(fake_user, project, conversation, key))

    response = client.post(
        f"/api/v1/saas-projects/{project.id}/conversations/{conversation.id}/messages",
        json={"ai_key_id": str(key.id), "model_name": "groq/model", "message": "Hola"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400


def test_foreign_project_returns_404():
    fake_user = FakeUser()
    other_user = FakeUser()
    project = FakeProject(owner_id=other_user.id)
    conversation = FakeConversation(project_id=project.id, user_id=other_user.id)
    key = FakeKey(fake_user.id)
    client = build_client(fake_user, build_service(fake_user, project, conversation, key))

    response = client.post(
        f"/api/v1/saas-projects/{project.id}/conversations/{conversation.id}/messages",
        json={"ai_key_id": str(key.id), "model_name": "groq/model", "message": "Hola"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 404
