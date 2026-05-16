import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.deps import get_current_user, get_dashboard_service
from app.main import app
from app.models.enums import (
    DecisionRecommendation,
    SaasCategory,
    SaasStage,
    SustainabilityLevel,
    UserRole,
)
from app.services.dashboard_service import DashboardService
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
    def __init__(
        self,
        *,
        owner_id: uuid.UUID,
        name: str,
        slug: str,
        stage: SaasStage = SaasStage.IDEA,
        category: SaasCategory | None = None,
    ) -> None:
        now = datetime.now(timezone.utc)
        self.id = uuid.uuid4()
        self.owner_id = owner_id
        self.name = name
        self.slug = slug
        self.stage = stage
        self.category = category
        self.business_model = None
        self.current_price = Decimal("9.99")
        self.currency = "USD"
        self.created_at = now
        self.updated_at = now
        self.deleted_at = None


class FakeSnapshot:
    def __init__(self, *, project_id: uuid.UUID, captured_at: datetime, **values) -> None:
        self.id = uuid.uuid4()
        self.saas_project_id = project_id
        self.period_label = "Marzo 2026"
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
    def __init__(self, *, project_id: uuid.UUID, overall_score: Decimal) -> None:
        self.id = uuid.uuid4()
        self.saas_project_id = project_id
        self.metric_snapshot_id = None
        self.overall_score = overall_score
        self.financial_score = Decimal("70.00")
        self.growth_score = Decimal("65.00")
        self.retention_score = Decimal("75.00")
        self.product_score = Decimal("85.00")
        self.risk_score = Decimal("80.00")
        self.sustainability_level = SustainabilityLevel.HEALTHY if overall_score >= 80 else SustainabilityLevel.RISKY
        self.decision_recommendation = (
            DecisionRecommendation.CONTINUE if overall_score >= 80 else DecisionRecommendation.PIVOT
        )
        self.strengths = []
        self.weaknesses = []
        self.alerts = (
            [
                {
                    "severity": "high",
                    "code": "HIGH_CHURN",
                    "title": "Churn alto",
                    "message": "Revisar retencion.",
                }
            ]
            if overall_score < 50
            else []
        )
        self.recommendations = [{"priority": "high", "title": "Mejorar retencion", "message": "Reducir churn."}]
        self.scoring_version = "v1"
        self.created_at = datetime.now(timezone.utc)


class FakeSaasProjectRepository:
    def __init__(self, projects: list[FakeProject]) -> None:
        self.projects = projects

    async def list_all_for_owner(self, *, owner_id):
        return [project for project in self.projects if project.owner_id == owner_id and project.deleted_at is None]

    async def get_by_id_for_owner(self, *, project_id, owner_id):
        for project in self.projects:
            if project.id == project_id and project.owner_id == owner_id and project.deleted_at is None:
                return project
        return None


class FakeMetricSnapshotRepository:
    def __init__(self, snapshots: list[FakeSnapshot]) -> None:
        self.snapshots = snapshots

    async def get_latest_by_project(self, *, saas_project_id):
        matches = [snapshot for snapshot in self.snapshots if snapshot.saas_project_id == saas_project_id]
        return sorted(matches, key=lambda snapshot: snapshot.captured_at, reverse=True)[0] if matches else None

    async def get_previous_snapshot(self, *, saas_project_id, captured_at):
        matches = [
            snapshot
            for snapshot in self.snapshots
            if snapshot.saas_project_id == saas_project_id and snapshot.captured_at < captured_at
        ]
        return sorted(matches, key=lambda snapshot: snapshot.captured_at, reverse=True)[0] if matches else None

    async def list_recent_by_project(self, *, saas_project_id, limit=12, ascending=True):
        matches = [snapshot for snapshot in self.snapshots if snapshot.saas_project_id == saas_project_id]
        matches = sorted(matches, key=lambda snapshot: snapshot.captured_at, reverse=not ascending)
        return matches[:limit]


class FakeSaasScoreRepository:
    def __init__(self, scores: list[FakeScore]) -> None:
        self.scores = scores

    async def get_latest_by_project(self, *, saas_project_id):
        matches = [score for score in self.scores if score.saas_project_id == saas_project_id]
        return sorted(matches, key=lambda score: score.created_at, reverse=True)[0] if matches else None

    async def list_recent_by_project(self, *, saas_project_id, limit=12, ascending=True):
        matches = [score for score in self.scores if score.saas_project_id == saas_project_id]
        matches = sorted(matches, key=lambda score: score.created_at, reverse=not ascending)
        return matches[:limit]


def build_service(
    *,
    projects: list[FakeProject],
    snapshots: list[FakeSnapshot] | None = None,
    scores: list[FakeScore] | None = None,
) -> DashboardService:
    project_repository = FakeSaasProjectRepository(projects)
    snapshot_repository = FakeMetricSnapshotRepository(snapshots or [])
    score_repository = FakeSaasScoreRepository(scores or [])
    calculation_service = MetricCalculationService(snapshot_repository, project_repository)
    return DashboardService(
        project_repository,
        snapshot_repository,
        score_repository,
        calculation_service,
    )


def build_client(fake_user: FakeUser, service: DashboardService) -> TestClient:
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_dashboard_service] = lambda: service
    return TestClient(app)


def test_portfolio_dashboard_requires_auth():
    client = TestClient(app)

    response = client.get("/api/v1/dashboard/portfolio")

    assert response.status_code == 401


def test_portfolio_dashboard_returns_empty_structure_without_projects():
    fake_user = FakeUser()
    client = build_client(fake_user, build_service(projects=[]))

    response = client.get("/api/v1/dashboard/portfolio")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] == 0
    assert data["average_overall_score"] is None
    assert data["recent_projects"] == []
    assert data["global_recommendations"][0]["title"] == "Crear primer SaaS"


def test_portfolio_dashboard_returns_basic_counts():
    fake_user = FakeUser()
    project_one = FakeProject(
        owner_id=fake_user.id,
        name="StudyFlow AI",
        slug="studyflow-ai",
        stage=SaasStage.MVP,
        category=SaasCategory.EDTECH,
    )
    project_two = FakeProject(
        owner_id=fake_user.id,
        name="CRM Pro",
        slug="crm-pro",
        stage=SaasStage.LAUNCHED,
        category=SaasCategory.OTHER,
    )
    scores = [FakeScore(project_id=project_one.id, overall_score=Decimal("84.00"))]
    client = build_client(fake_user, build_service(projects=[project_one, project_two], scores=scores))

    response = client.get("/api/v1/dashboard/portfolio")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["total_projects"] == 2
    assert data["projects_by_stage"]["MVP"] == 1
    assert data["projects_by_stage"]["LAUNCHED"] == 1
    assert data["projects_by_category"]["EDTECH"] == 1
    assert data["average_overall_score"] == "84.00"
    assert data["healthiest_project"]["slug"] == "studyflow-ai"


def test_project_dashboard_requires_auth():
    client = TestClient(app)
    project_id = uuid.uuid4()

    response = client.get(f"/api/v1/saas-projects/{project_id}/dashboard")

    assert response.status_code == 401


def test_project_dashboard_returns_404_for_foreign_project():
    fake_user = FakeUser()
    other_user = FakeUser()
    project = FakeProject(owner_id=other_user.id, name="Other", slug="other")
    client = build_client(fake_user, build_service(projects=[project]))

    response = client.get(f"/api/v1/saas-projects/{project.id}/dashboard")

    app.dependency_overrides.clear()

    assert response.status_code == 404


def test_project_dashboard_returns_project_cards_series_alerts_and_recommendations():
    fake_user = FakeUser()
    project = FakeProject(
        owner_id=fake_user.id,
        name="StudyFlow AI",
        slug="studyflow-ai",
        stage=SaasStage.MVP,
        category=SaasCategory.EDTECH,
    )
    snapshot = FakeSnapshot(
        project_id=project.id,
        captured_at=datetime(2026, 3, 31, tzinfo=timezone.utc),
        mrr=Decimal("1200.00"),
        monthly_revenue=Decimal("1500.00"),
        monthly_costs=Decimal("900.00"),
        paying_customers=60,
        total_users=800,
        active_users=300,
        churned_customers=5,
        uptime_percentage=Decimal("99.50"),
    )
    score = FakeScore(project_id=project.id, overall_score=Decimal("78.00"))
    client = build_client(
        fake_user,
        build_service(projects=[project], snapshots=[snapshot], scores=[score]),
    )

    response = client.get(f"/api/v1/saas-projects/{project.id}/dashboard")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert data["project"]["slug"] == "studyflow-ai"
    assert data["latest_snapshot"]["id"] == str(snapshot.id)
    assert data["latest_score"]["overall_score"] == "78.00"
    assert data["metric_cards"]["mrr"] == "1200.00"
    assert data["metric_cards"]["arr"] == "14400.00"
    assert "mrr" in data["series"]
    assert len(data["series"]["mrr"]) == 1
    assert isinstance(data["alerts"], list)
    assert isinstance(data["recommendations"], list)
