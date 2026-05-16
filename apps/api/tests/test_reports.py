import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_report_service
from app.main import app
from app.models.enums import (
    DecisionRecommendation,
    ReportStatus,
    ReportType,
    SaasStage,
    SustainabilityLevel,
    UserRole,
)
from app.services.dashboard_service import DashboardService
from app.services.metric_calculation_service import MetricCalculationService
from app.services.report_service import ReportService


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
    def __init__(self, *, owner_id: uuid.UUID, name: str = "StudyFlow AI") -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.owner_id = owner_id
        self.name = name
        self.slug = name.lower().replace(" ", "-")
        self.stage = SaasStage.MVP
        self.category = None
        self.business_model = None
        self.current_price = Decimal("9.99")
        self.currency = "USD"
        self.created_at = now
        self.updated_at = now
        self.deleted_at = None


class FakeSnapshot:
    def __init__(self, *, project_id: uuid.UUID) -> None:
        self.id = uuid.uuid4()
        self.saas_project_id = project_id
        self.period_label = "Marzo 2026"
        self.captured_at = datetime(2026, 3, 31, tzinfo=timezone.utc)
        self.mrr = Decimal("1200.00")
        self.arr = None
        self.monthly_revenue = Decimal("1500.00")
        self.monthly_costs = Decimal("900.00")
        self.gross_profit = None
        self.net_profit = None
        self.cash_available = Decimal("10000.00")
        self.burn_rate = None
        self.total_users = 800
        self.active_users = 300
        self.paying_customers = 60
        self.new_users = 100
        self.new_paying_customers = 10
        self.churned_customers = 4
        self.cac = None
        self.marketing_spend = Decimal("700.00")
        self.churn_rate = None
        self.retention_rate = None
        self.conversion_rate = None
        self.arpu = None
        self.ltv = None
        self.ltv_cac_ratio = None
        self.payback_months = None
        self.growth_rate = None
        self.runway_months = None
        self.nps = Decimal("45")
        self.avg_session_minutes = Decimal("12")
        self.support_tickets = 12
        self.critical_bugs = 0
        self.uptime_percentage = Decimal("99.50")


class FakeScore:
    def __init__(self, *, project_id: uuid.UUID, snapshot_id: uuid.UUID | None = None) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.saas_project_id = project_id
        self.metric_snapshot_id = snapshot_id
        self.overall_score = Decimal("78.00")
        self.financial_score = Decimal("70.00")
        self.growth_score = Decimal("80.00")
        self.retention_score = Decimal("76.00")
        self.product_score = Decimal("85.00")
        self.risk_score = Decimal("72.00")
        self.sustainability_level = SustainabilityLevel.VIABLE_WITH_ADJUSTMENTS
        self.decision_recommendation = DecisionRecommendation.IMPROVE
        self.strengths = [{"code": "HIGH_UPTIME", "title": "Alta disponibilidad", "message": "Buen uptime."}]
        self.weaknesses = []
        self.alerts = []
        self.recommendations = [{"priority": "medium", "title": "Mejorar conversion", "message": "Optimizar funnel."}]
        self.scoring_version = "v1"
        self.created_at = now


class FakeReport:
    def __init__(self, **data) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.created_at = now
        self.updated_at = now
        for field, value in data.items():
            setattr(self, field, value)


class FakeProjectRepository:
    def __init__(self, projects: list[FakeProject]) -> None:
        self.projects = projects

    async def get_by_id_for_owner(self, *, project_id, owner_id):
        for project in self.projects:
            if project.id == project_id and project.owner_id == owner_id and project.deleted_at is None:
                return project
        return None

    async def list_all_for_owner(self, *, owner_id):
        return [project for project in self.projects if project.owner_id == owner_id and project.deleted_at is None]


class FakeSnapshotRepository:
    def __init__(self, snapshots: list[FakeSnapshot]) -> None:
        self.snapshots = snapshots

    async def get_latest_by_project(self, *, saas_project_id):
        matches = [snapshot for snapshot in self.snapshots if snapshot.saas_project_id == saas_project_id]
        return matches[0] if matches else None

    async def get_previous_snapshot(self, *, saas_project_id, captured_at):
        return None

    async def list_recent_by_project(self, *, saas_project_id, limit=12, ascending=True):
        return [snapshot for snapshot in self.snapshots if snapshot.saas_project_id == saas_project_id][:limit]


class FakeScoreRepository:
    def __init__(self, scores: list[FakeScore]) -> None:
        self.scores = scores

    async def get_latest_by_project(self, *, saas_project_id):
        matches = [score for score in self.scores if score.saas_project_id == saas_project_id]
        return matches[0] if matches else None

    async def list_recent_by_project(self, *, saas_project_id, limit=12, ascending=True):
        return [score for score in self.scores if score.saas_project_id == saas_project_id][:limit]


class FakeReportRepository:
    def __init__(self) -> None:
        self.reports: list[FakeReport] = []

    async def create(self, *, data):
        report = FakeReport(**data)
        self.reports.append(report)
        return report

    async def list_by_project(self, *, saas_project_id, limit=20, offset=0, report_type=None):
        reports = [report for report in self.reports if report.saas_project_id == saas_project_id]
        if report_type is not None:
            reports = [report for report in reports if report.report_type == report_type]
        return reports[offset : offset + limit]

    async def count_by_project(self, *, saas_project_id, report_type=None):
        return len(await self.list_by_project(saas_project_id=saas_project_id, limit=100, offset=0, report_type=report_type))

    async def get_by_id_for_project(self, *, report_id, saas_project_id):
        for report in self.reports:
            if report.id == report_id and report.saas_project_id == saas_project_id:
                return report
        return None


def build_service(
    *,
    projects: list[FakeProject],
    snapshots: list[FakeSnapshot] | None = None,
    scores: list[FakeScore] | None = None,
) -> ReportService:
    project_repository = FakeProjectRepository(projects)
    snapshot_repository = FakeSnapshotRepository(snapshots or [])
    score_repository = FakeScoreRepository(scores or [])
    calculation_service = MetricCalculationService(snapshot_repository, project_repository)
    dashboard_service = DashboardService(
        project_repository,
        snapshot_repository,
        score_repository,
        calculation_service,
    )
    return ReportService(
        FakeReportRepository(),
        project_repository,
        snapshot_repository,
        score_repository,
        dashboard_service,
    )


def build_client(fake_user: FakeUser, service: ReportService) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_report_service] = lambda: service
    return TestClient(app)


def test_reports_require_auth():
    client = TestClient(app)
    project_id = uuid.uuid4()

    response = client.get(f"/api/v1/saas-projects/{project_id}/reports")

    assert response.status_code == 401


def test_generate_basic_report():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    snapshot = FakeSnapshot(project_id=project.id)
    score = FakeScore(project_id=project.id, snapshot_id=snapshot.id)
    client = build_client(fake_user, build_service(projects=[project], snapshots=[snapshot], scores=[score]))

    response = client.post(f"/api/v1/saas-projects/{project.id}/reports/basic")

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["report_type"] == "BASIC"
    assert data["status"] == "GENERATED"
    assert data["file_url"] is None
    assert data["ai_analysis_id"] is None
    assert data["content"]["kind"] == "BASIC"


def test_generate_executive_report():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    snapshot = FakeSnapshot(project_id=project.id)
    score = FakeScore(project_id=project.id, snapshot_id=snapshot.id)
    client = build_client(fake_user, build_service(projects=[project], snapshots=[snapshot], scores=[score]))

    response = client.post(f"/api/v1/saas-projects/{project.id}/reports/executive")

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data = response.json()
    assert data["report_type"] == "EXECUTIVE"
    assert data["content"]["kind"] == "EXECUTIVE"
    assert "executive_summary" in data["content"]
    assert "series" in data["content"]


def test_list_reports_returns_paginated_response():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    service = build_service(projects=[project])
    client = build_client(fake_user, service)
    client.post(f"/api/v1/saas-projects/{project.id}/reports/basic")
    client.post(f"/api/v1/saas-projects/{project.id}/reports/executive")

    response = client.get(f"/api/v1/saas-projects/{project.id}/reports?limit=1&offset=0")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["limit"] == 1
    assert data["offset"] == 0
    assert len(data["items"]) == 1


def test_get_report_by_id():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    service = build_service(projects=[project])
    client = build_client(fake_user, service)
    created = client.post(f"/api/v1/saas-projects/{project.id}/reports/basic").json()

    response = client.get(f"/api/v1/saas-projects/{project.id}/reports/{created['id']}")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_foreign_project_returns_404():
    fake_user = FakeUser()
    other_user = FakeUser()
    project = FakeProject(owner_id=other_user.id)
    client = build_client(fake_user, build_service(projects=[project]))

    response = client.post(f"/api/v1/saas-projects/{project.id}/reports/basic")

    app.dependency_overrides.clear()

    assert response.status_code == 404


def test_report_generates_without_snapshot_or_score_with_data_quality_notes():
    fake_user = FakeUser()
    project = FakeProject(owner_id=fake_user.id)
    client = build_client(fake_user, build_service(projects=[project]))

    response = client.post(f"/api/v1/saas-projects/{project.id}/reports/basic")

    app.dependency_overrides.clear()

    assert response.status_code == 201
    data_quality = response.json()["content"]["data_quality"]
    assert data_quality["has_snapshot"] is False
    assert data_quality["has_score"] is False
    assert len(data_quality["notes"]) == 2
