import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_saas_score_service
from app.main import app
from app.models.enums import UserRole
from app.services.metric_calculation_service import MetricCalculationService
from app.services.saas_score_service import SaasScoreService


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
    def __init__(self, *, project_id: uuid.UUID, owner_id: uuid.UUID, stage: str = "MVP") -> None:
        self.id = project_id
        self.owner_id = owner_id
        self.stage = stage
        self.deleted_at = None


class FakeSnapshot:
    def __init__(self, *, project_id: uuid.UUID, captured_at: datetime, **values) -> None:
        self.id = uuid.uuid4()
        self.saas_project_id = project_id
        self.captured_at = captured_at
        self.mrr = None
        self.arr = None
        self.monthly_revenue = None
        self.monthly_costs = None
        self.gross_profit = None
        self.net_profit = None
        self.cash_available = None
        self.burn_rate = None
        self.total_users = None
        self.active_users = None
        self.paying_customers = None
        self.new_users = None
        self.new_paying_customers = None
        self.churned_customers = None
        self.cac = None
        self.marketing_spend = None
        self.churn_rate = None
        self.retention_rate = None
        self.conversion_rate = None
        self.arpu = None
        self.ltv = None
        self.ltv_cac_ratio = None
        self.payback_months = None
        self.growth_rate = None
        self.runway_months = None
        self.nps = None
        self.avg_session_minutes = None
        self.support_tickets = None
        self.critical_bugs = None
        self.uptime_percentage = None
        for field, value in values.items():
            setattr(self, field, value)


class FakeScore:
    def __init__(self, **data) -> None:
        self.id = uuid.uuid4()
        self.created_at = datetime.now(timezone.utc)
        for field, value in data.items():
            setattr(self, field, value)


class FakeSaasProjectRepository:
    def __init__(self, project: FakeProject) -> None:
        self.project = project

    async def get_by_id_for_owner(self, *, project_id, owner_id):
        if self.project.id == project_id and self.project.owner_id == owner_id:
            return self.project
        return None


class FakeMetricSnapshotRepository:
    def __init__(self, snapshots: list[FakeSnapshot]) -> None:
        self.snapshots = snapshots

    async def get_latest_by_project(self, *, saas_project_id):
        matches = [snapshot for snapshot in self.snapshots if snapshot.saas_project_id == saas_project_id]
        return sorted(matches, key=lambda snapshot: snapshot.captured_at, reverse=True)[0] if matches else None

    async def get_by_id_for_project(self, *, snapshot_id, saas_project_id):
        for snapshot in self.snapshots:
            if snapshot.id == snapshot_id and snapshot.saas_project_id == saas_project_id:
                return snapshot
        return None

    async def get_previous_snapshot(self, *, saas_project_id, captured_at):
        matches = [
            snapshot
            for snapshot in self.snapshots
            if snapshot.saas_project_id == saas_project_id and snapshot.captured_at < captured_at
        ]
        return sorted(matches, key=lambda snapshot: snapshot.captured_at, reverse=True)[0] if matches else None


class FakeSaasScoreRepository:
    def __init__(self) -> None:
        self.scores: list[FakeScore] = []

    async def create(self, *, data):
        score = FakeScore(**data)
        self.scores.append(score)
        return score

    async def list_by_project(self, *, saas_project_id, limit=20, offset=0):
        matches = [score for score in self.scores if score.saas_project_id == saas_project_id]
        matches.sort(key=lambda score: score.created_at, reverse=True)
        return matches[offset : offset + limit]

    async def count_by_project(self, *, saas_project_id):
        return len([score for score in self.scores if score.saas_project_id == saas_project_id])

    async def get_by_id_for_project(self, *, score_id, saas_project_id):
        for score in self.scores:
            if score.id == score_id and score.saas_project_id == saas_project_id:
                return score
        return None

    async def get_latest_by_project(self, *, saas_project_id):
        matches = [score for score in self.scores if score.saas_project_id == saas_project_id]
        return sorted(matches, key=lambda score: score.created_at, reverse=True)[0] if matches else None


def build_service(fake_user: FakeUser, project_id: uuid.UUID, snapshots: list[FakeSnapshot]) -> SaasScoreService:
    project_repository = FakeSaasProjectRepository(FakeProject(project_id=project_id, owner_id=fake_user.id))
    snapshot_repository = FakeMetricSnapshotRepository(snapshots)
    calculation_service = MetricCalculationService(snapshot_repository, project_repository)
    return SaasScoreService(
        FakeSaasScoreRepository(),
        project_repository,
        snapshot_repository,
        calculation_service,
    )


def build_client(fake_user: FakeUser, service: SaasScoreService) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_saas_score_service] = lambda: service
    return TestClient(app)


def healthy_snapshot(project_id: uuid.UUID) -> FakeSnapshot:
    return FakeSnapshot(
        project_id=project_id,
        captured_at=datetime(2026, 3, 31, tzinfo=timezone.utc),
        mrr=Decimal("2000.00"),
        monthly_revenue=Decimal("2200.00"),
        monthly_costs=Decimal("1200.00"),
        cash_available=Decimal("18000.00"),
        total_users=1000,
        active_users=500,
        paying_customers=80,
        new_users=120,
        new_paying_customers=12,
        churned_customers=3,
        marketing_spend=Decimal("900.00"),
        nps=Decimal("55"),
        avg_session_minutes=Decimal("18"),
        support_tickets=20,
        critical_bugs=0,
        uptime_percentage=Decimal("99.50"),
    )


def test_saas_scores_require_auth():
    client = TestClient(app)
    project_id = uuid.uuid4()

    response = client.get(f"/api/v1/saas-projects/{project_id}/scores")

    assert response.status_code == 401


def test_generate_latest_score_with_sufficient_data():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    service = build_service(fake_user, project_id, [healthy_snapshot(project_id)])
    client = build_client(fake_user, service)

    response = client.post(f"/api/v1/saas-projects/{project_id}/scores/latest")

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert Decimal(data["overall_score"]) > 0
    assert data["sustainability_level"] in {"HEALTHY", "VIABLE_WITH_ADJUSTMENTS"}
    assert data["decision_recommendation"] in {"CONTINUE", "IMPROVE"}
    assert isinstance(data["strengths"], list)
    assert isinstance(data["weaknesses"], list)
    assert isinstance(data["alerts"], list)
    assert isinstance(data["recommendations"], list)
    assert data["scoring_version"] == "v1"


def test_generate_score_for_specific_snapshot():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    snapshot = healthy_snapshot(project_id)
    service = build_service(fake_user, project_id, [snapshot])
    client = build_client(fake_user, service)

    response = client.post(f"/api/v1/saas-projects/{project_id}/scores/snapshots/{snapshot.id}")

    app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["metric_snapshot_id"] == str(snapshot.id)


def test_list_scores_returns_paginated_response():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    service = build_service(fake_user, project_id, [healthy_snapshot(project_id)])
    client = build_client(fake_user, service)
    client.post(f"/api/v1/saas-projects/{project_id}/scores/latest")
    client.post(f"/api/v1/saas-projects/{project_id}/scores/latest")

    response = client.get(f"/api/v1/saas-projects/{project_id}/scores?limit=1&offset=0")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["limit"] == 1
    assert data["offset"] == 0
    assert len(data["items"]) == 1


def test_get_latest_score():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    service = build_service(fake_user, project_id, [healthy_snapshot(project_id)])
    client = build_client(fake_user, service)
    created = client.post(f"/api/v1/saas-projects/{project_id}/scores/latest").json()

    response = client.get(f"/api/v1/saas-projects/{project_id}/scores/latest")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_generate_latest_without_snapshots_returns_404():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    service = build_service(fake_user, project_id, [])
    client = build_client(fake_user, service)

    response = client.post(f"/api/v1/saas-projects/{project_id}/scores/latest")

    app.dependency_overrides.clear()

    assert response.status_code == 404
