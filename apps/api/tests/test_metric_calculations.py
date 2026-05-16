import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_metric_calculation_service
from app.main import app
from app.models.enums import UserRole
from app.services.metric_calculation_service import MetricCalculationService


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
    def __init__(self, *, project_id: uuid.UUID, owner_id: uuid.UUID) -> None:
        self.id = project_id
        self.owner_id = owner_id
        self.deleted_at = None


class FakeSnapshot:
    def __init__(
        self,
        *,
        project_id: uuid.UUID,
        captured_at: datetime,
        **values,
    ) -> None:
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
        self.support_tickets = None
        self.critical_bugs = None
        self.uptime_percentage = None
        for field, value in values.items():
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
        project_snapshots = [
            snapshot for snapshot in self.snapshots if snapshot.saas_project_id == saas_project_id
        ]
        if not project_snapshots:
            return None
        return sorted(project_snapshots, key=lambda snapshot: snapshot.captured_at, reverse=True)[0]

    async def get_by_id_for_project(self, *, snapshot_id, saas_project_id):
        for snapshot in self.snapshots:
            if snapshot.id == snapshot_id and snapshot.saas_project_id == saas_project_id:
                return snapshot
        return None

    async def get_previous_snapshot(self, *, saas_project_id, captured_at):
        previous = [
            snapshot
            for snapshot in self.snapshots
            if snapshot.saas_project_id == saas_project_id and snapshot.captured_at < captured_at
        ]
        if not previous:
            return None
        return sorted(previous, key=lambda snapshot: snapshot.captured_at, reverse=True)[0]


def build_client(
    fake_user: FakeUser,
    snapshots: list[FakeSnapshot],
    project_id: uuid.UUID,
) -> TestClient:
    project = FakeProject(project_id=project_id, owner_id=fake_user.id)
    service = MetricCalculationService(
        FakeMetricSnapshotRepository(snapshots),
        FakeSaasProjectRepository(project),
    )
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_metric_calculation_service] = lambda: service
    return TestClient(app)


def test_metric_calculations_require_auth():
    client = TestClient(app)
    project_id = uuid.uuid4()

    response = client.get(f"/api/v1/saas-projects/{project_id}/metric-calculations/latest")

    assert response.status_code == 401


def test_calculate_latest_with_basic_snapshot():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    snapshot = FakeSnapshot(
        project_id=project_id,
        captured_at=datetime(2026, 3, 31, 23, 59, tzinfo=timezone.utc),
        mrr=Decimal("1200.00"),
        monthly_revenue=Decimal("1500.00"),
        paying_customers=50,
        total_users=1000,
    )
    client = build_client(fake_user, [snapshot], project_id)

    response = client.get(f"/api/v1/saas-projects/{project_id}/metric-calculations/latest")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["snapshot_id"] == str(snapshot.id)
    assert data["metrics"]["mrr"]["source"] == "provided"
    assert "metrics" in data
    assert "warnings" in data
    assert "summary" in data


def test_calculate_arr_from_mrr():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    snapshot = FakeSnapshot(
        project_id=project_id,
        captured_at=datetime(2026, 3, 31, tzinfo=timezone.utc),
        mrr=Decimal("1200.00"),
    )
    client = build_client(fake_user, [snapshot], project_id)

    response = client.get(f"/api/v1/saas-projects/{project_id}/metric-calculations/latest")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    arr = response.json()["metrics"]["arr"]
    assert arr["source"] == "calculated"
    assert Decimal(arr["value"]) == Decimal("14400.00")
    assert arr["formula"] == "ARR = MRR * 12"


def test_calculate_conversion_rate_from_paying_customers_and_total_users():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    snapshot = FakeSnapshot(
        project_id=project_id,
        captured_at=datetime(2026, 3, 31, tzinfo=timezone.utc),
        paying_customers=75,
        total_users=1000,
    )
    client = build_client(fake_user, [snapshot], project_id)

    response = client.get(f"/api/v1/saas-projects/{project_id}/metric-calculations/latest")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    conversion_rate = response.json()["metrics"]["conversion_rate"]
    assert conversion_rate["source"] == "calculated"
    assert Decimal(conversion_rate["value"]) == Decimal("0.0750")


def test_calculate_latest_without_snapshots_returns_404():
    fake_user = FakeUser()
    project_id = uuid.uuid4()
    client = build_client(fake_user, [], project_id)

    response = client.get(f"/api/v1/saas-projects/{project_id}/metric-calculations/latest")

    app.dependency_overrides.clear()

    assert response.status_code == 404
