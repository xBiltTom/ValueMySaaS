import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_metric_snapshot_service
from app.main import app
from app.models.enums import UserRole


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


class FakeSnapshot:
    def __init__(
        self,
        *,
        project_id: uuid.UUID,
        period_label: str | None,
        captured_at: datetime,
    ) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.saas_project_id = project_id
        self.period_label = period_label
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
        self.custom_metrics = None
        self.notes = None
        self.created_at = now
        self.updated_at = now


class FakeMetricSnapshotService:
    def __init__(self) -> None:
        self.project_id = uuid.uuid4()
        self.snapshots: dict[uuid.UUID, FakeSnapshot] = {}

    async def create_snapshot(self, *, project_id, owner_id, payload):
        if project_id != self.project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")
        captured_at = payload.captured_at or datetime.now(timezone.utc)
        snapshot = FakeSnapshot(
            project_id=project_id,
            period_label=payload.period_label,
            captured_at=captured_at,
        )
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(snapshot, field, value)
        self.snapshots[snapshot.id] = snapshot
        return snapshot

    async def list_snapshots(self, *, project_id, owner_id, limit=20, offset=0, from_date=None, to_date=None):
        if project_id != self.project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")
        snapshots = [snapshot for snapshot in self.snapshots.values() if snapshot.saas_project_id == project_id]
        if from_date is not None:
            snapshots = [snapshot for snapshot in snapshots if snapshot.captured_at >= from_date]
        if to_date is not None:
            snapshots = [snapshot for snapshot in snapshots if snapshot.captured_at <= to_date]
        snapshots.sort(key=lambda snapshot: snapshot.captured_at, reverse=True)
        return {
            "items": snapshots[offset : offset + limit],
            "total": len(snapshots),
            "limit": limit,
            "offset": offset,
        }

    async def get_snapshot(self, *, project_id, snapshot_id, owner_id):
        if project_id != self.project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")
        snapshot = self.snapshots.get(snapshot_id)
        if snapshot is None or snapshot.saas_project_id != project_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Metric snapshot not found")
        return snapshot

    async def update_snapshot(self, *, project_id, snapshot_id, owner_id, payload):
        snapshot = await self.get_snapshot(project_id=project_id, snapshot_id=snapshot_id, owner_id=owner_id)
        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(snapshot, field, value)
        snapshot.updated_at = datetime.now(timezone.utc)
        return snapshot

    async def delete_snapshot(self, *, project_id, snapshot_id, owner_id):
        snapshot = await self.get_snapshot(project_id=project_id, snapshot_id=snapshot_id, owner_id=owner_id)
        del self.snapshots[snapshot.id]


def build_client(fake_user: FakeUser, fake_service: FakeMetricSnapshotService) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_metric_snapshot_service] = lambda: fake_service
    return TestClient(app)


def test_metric_snapshots_require_auth():
    client = TestClient(app)
    project_id = uuid.uuid4()

    response = client.get(f"/api/v1/saas-projects/{project_id}/metric-snapshots")

    assert response.status_code == 401


def test_create_metric_snapshot():
    fake_user = FakeUser()
    fake_service = FakeMetricSnapshotService()
    client = build_client(fake_user, fake_service)

    response = client.post(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots",
        json={
            "period_label": "Marzo 2026",
            "mrr": "1200.00",
            "total_users": 800,
            "nps": "42",
            "custom_metrics": {"activation_rate": 0.38},
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["period_label"] == "Marzo 2026"
    assert Decimal(data["mrr"]) == Decimal("1200.00")
    assert data["total_users"] == 800
    assert Decimal(data["nps"]) == Decimal("42")


def test_list_metric_snapshots_returns_paginated_response():
    fake_user = FakeUser()
    fake_service = FakeMetricSnapshotService()
    client = build_client(fake_user, fake_service)
    client.post(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots",
        json={"period_label": "Febrero 2026", "captured_at": "2026-02-28T23:59:00Z"},
    )
    client.post(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots",
        json={"period_label": "Marzo 2026", "captured_at": "2026-03-31T23:59:00Z"},
    )

    response = client.get(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots?limit=1&offset=0"
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["limit"] == 1
    assert data["offset"] == 0
    assert len(data["items"]) == 1
    assert data["items"][0]["period_label"] == "Marzo 2026"


def test_get_metric_snapshot_detail():
    fake_user = FakeUser()
    fake_service = FakeMetricSnapshotService()
    client = build_client(fake_user, fake_service)
    create_response = client.post(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots",
        json={"period_label": "Marzo 2026", "support_tickets": 18},
    )
    snapshot_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots/{snapshot_id}"
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["support_tickets"] == 18


def test_update_metric_snapshot():
    fake_user = FakeUser()
    fake_service = FakeMetricSnapshotService()
    client = build_client(fake_user, fake_service)
    create_response = client.post(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots",
        json={"period_label": "Marzo 2026", "critical_bugs": 2},
    )
    snapshot_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots/{snapshot_id}",
        json={"critical_bugs": 1, "notes": "Correccion post release"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["critical_bugs"] == 1
    assert response.json()["notes"] == "Correccion post release"


def test_delete_metric_snapshot():
    fake_user = FakeUser()
    fake_service = FakeMetricSnapshotService()
    client = build_client(fake_user, fake_service)
    create_response = client.post(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots",
        json={"period_label": "Marzo 2026"},
    )
    snapshot_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots/{snapshot_id}"
    )
    get_response = client.get(
        f"/api/v1/saas-projects/{fake_service.project_id}/metric-snapshots/{snapshot_id}"
    )

    app.dependency_overrides.clear()

    assert delete_response.status_code == 204
    assert get_response.status_code == 404
