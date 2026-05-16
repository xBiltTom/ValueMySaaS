import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from app.api.deps import get_auth_service
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.enums import UserRole
from app.schemas.auth import Token


class FakeUser:
    def __init__(
        self,
        *,
        email: str,
        password: str = "password123",
        username: str | None = None,
        full_name: str | None = None,
        is_active: bool = True,
    ) -> None:
        self.id = uuid.uuid4()
        self.email = email
        self.username = username
        self.full_name = full_name
        self.hashed_password = hash_password(password)
        self.role = UserRole.USER
        self.is_active = is_active
        self.is_verified = False
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = self.created_at
        self.deleted_at = None


class FakeAuthService:
    def __init__(self) -> None:
        self.users_by_email: dict[str, FakeUser] = {}
        self.users_by_id: dict[uuid.UUID, FakeUser] = {}

    async def register_user(self, payload):
        email = payload.email.lower()
        if email in self.users_by_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        user = FakeUser(
            email=email,
            password=payload.password,
            username=payload.username,
            full_name=payload.full_name,
        )
        self.users_by_email[email] = user
        self.users_by_id[user.id] = user
        return user

    async def login(self, email: str, password: str) -> Token:
        user = self.users_by_email.get(email.lower())
        if user is None or password != "password123":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return Token(access_token=create_access_token(user.id))

    async def get_active_user(self, user_id: uuid.UUID):
        user = self.users_by_id.get(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user


def build_client(fake_service: FakeAuthService) -> TestClient:
    app.dependency_overrides[get_auth_service] = lambda: fake_service
    return TestClient(app)


def test_register_user():
    fake_service = FakeAuthService()
    client = build_client(fake_service)

    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "Ada@example.com",
            "password": "password123",
            "username": "ada",
            "full_name": "Ada Lovelace",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "ada@example.com"
    assert data["username"] == "ada"
    assert "hashed_password" not in data


def test_register_rejects_duplicate_email():
    fake_service = FakeAuthService()
    client = build_client(fake_service)

    payload = {"email": "ada@example.com", "password": "password123"}
    first_response = client.post("/api/v1/auth/register", json=payload)
    second_response = client.post("/api/v1/auth/register", json=payload)

    app.dependency_overrides.clear()

    assert first_response.status_code == 201
    assert second_response.status_code == 409


def test_login_returns_access_token():
    fake_service = FakeAuthService()
    client = build_client(fake_service)
    client.post(
        "/api/v1/auth/register",
        json={"email": "ada@example.com", "password": "password123"},
    )

    response = client.post(
        "/api/v1/auth/login",
        data={"username": "ada@example.com", "password": "password123"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_me_requires_bearer_token():
    fake_service = FakeAuthService()
    client = build_client(fake_service)

    response = client.get("/api/v1/auth/me")

    app.dependency_overrides.clear()

    assert response.status_code == 401


def test_me_returns_current_user():
    fake_service = FakeAuthService()
    client = build_client(fake_service)
    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": "ada@example.com", "password": "password123"},
    )
    user_id = uuid.UUID(register_response.json()["id"])
    token = create_access_token(user_id)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["email"] == "ada@example.com"
