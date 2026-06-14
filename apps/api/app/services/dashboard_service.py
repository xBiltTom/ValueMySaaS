from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import SaasCategory, SaasStage, SustainabilityLevel
from app.models.saas_project import SaasProject
from app.models.saas_score import SaasScore
from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.schemas.dashboard import (
    DashboardRecommendation,
    LatestScoreSummary,
    LatestSnapshotSummary,
    MetricCards,
    PortfolioAlertProject,
    PortfolioDashboardResponse,
    PortfolioProjectSummary,
    ProjectDashboardResponse,
    ProjectSeries,
    ProjectSummary,
    RecentProjectSummary,
    SeriesPoint,
)
from app.schemas.metric_calculation import MetricCalculationResponse
from app.services.metric_calculation_service import MetricCalculationService

SCORE_QUANT = Decimal("0.01")


class DashboardService:
    def __init__(
        self,
        saas_project_repository: SaasProjectRepository,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_score_repository: SaasScoreRepository,
        metric_calculation_service: MetricCalculationService,
    ) -> None:
        self.saas_project_repository = saas_project_repository
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_score_repository = saas_score_repository
        self.metric_calculation_service = metric_calculation_service

    async def get_portfolio_dashboard(self, *, owner_id: UUID) -> PortfolioDashboardResponse:
        projects = await self.saas_project_repository.list_all_for_owner(owner_id=owner_id)
        latest_scores: dict[UUID, SaasScore | None] = {}
        projects_without_snapshots = 0

        for project in projects:
            latest_scores[project.id] = await self.saas_score_repository.get_latest_by_project(
                saas_project_id=project.id,
            )
            latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(
                saas_project_id=project.id,
            )
            if latest_snapshot is None:
                projects_without_snapshots += 1

        scores = [score for score in latest_scores.values() if score is not None]
        score_values = [Decimal(str(score.overall_score)) for score in scores]
        average_score = None
        if score_values:
            average_score = (sum(score_values) / Decimal(len(score_values))).quantize(
                SCORE_QUANT,
                rounding=ROUND_HALF_UP,
            )

        healthiest_project = self._score_project_summary(
            projects,
            max(scores, key=lambda score: score.overall_score) if scores else None,
        )
        riskiest_project = self._score_project_summary(
            projects,
            min(scores, key=lambda score: score.overall_score) if scores else None,
        )

        scores_by_sustainability = {level.value: 0 for level in SustainabilityLevel}
        for score in scores:
            scores_by_sustainability[self._enum_value(score.sustainability_level)] += 1

        high_alert_projects = self._high_alert_projects(projects, scores)

        return PortfolioDashboardResponse(
            total_projects=len(projects),
            projects_by_stage=self._projects_by_stage(projects),
            projects_by_category=self._projects_by_category(projects),
            average_overall_score=average_score,
            scores_by_sustainability=scores_by_sustainability,
            healthiest_project=healthiest_project,
            riskiest_project=riskiest_project,
            recent_projects=[
                RecentProjectSummary(
                    project_id=project.id,
                    name=project.name,
                    slug=project.slug,
                    stage=project.stage,
                    category=project.category,
                    created_at=project.created_at,
                )
                for project in projects[:5]
            ],
            high_alert_projects=high_alert_projects,
            global_recommendations=self._global_recommendations(
                projects=projects,
                projects_without_snapshots=projects_without_snapshots,
                projects_without_scores=len(projects) - len(scores),
                scores=scores,
            ),
        )

    async def get_project_dashboard(
        self,
        *,
        project_id: UUID,
        owner_id: UUID,
    ) -> ProjectDashboardResponse:
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")

        # ------------------------------------------------------------------ #
        # Planning projects: show only costs + contextual AI Analysis message #
        # ------------------------------------------------------------------ #
        stage = project.stage if isinstance(project.stage, SaasStage) else SaasStage(project.stage)
        if stage in {SaasStage.IDEA, SaasStage.PLANNING}:
            latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(
                saas_project_id=project_id,
            )
            monthly_costs = (
                getattr(latest_snapshot, "monthly_costs", None) if latest_snapshot else None
            )
            planning_recommendation = DashboardRecommendation(
                priority="high",
                title="Proyecto en planeación",
                message=(
                    "Este proyecto está en planeación. Usa el Análisis IA para obtener "
                    "un diagnóstico de viabilidad."
                ),
            )
            return ProjectDashboardResponse(
                project=self._project_summary(project),
                latest_snapshot=self._latest_snapshot_summary(latest_snapshot),
                latest_score=None,
                metric_cards=MetricCards(monthly_costs=monthly_costs),
                alerts=[],
                recommendations=[planning_recommendation],
                series=ProjectSeries(
                    mrr=[],
                    monthly_revenue=[],
                    paying_customers=[],
                    active_users=[],
                    churn_rate=[],
                    overall_score=[],
                ),
            )

        # ------------------------------------------------------------------ #
        # Launched / operational projects: full financial dashboard           #
        # ------------------------------------------------------------------ #
        latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        calculation: MetricCalculationResponse | None = None
        if latest_snapshot is not None:
            calculation = await self.metric_calculation_service.calculate_latest_for_project(
                project_id=project_id,
                owner_id=owner_id,
            )

        latest_score = await self.saas_score_repository.get_latest_by_project(saas_project_id=project_id)
        alerts = latest_score.alerts if latest_score and latest_score.alerts else []
        recommendations: list[dict | DashboardRecommendation] = (
            latest_score.recommendations if latest_score and latest_score.recommendations else []
        )
        if latest_snapshot is None:
            recommendations.append(
                DashboardRecommendation(
                    priority="high",
                    title="Registrar metricas",
                    message="Agrega el primer snapshot de metricas para activar el dashboard operativo.",
                )
            )
        if latest_score is None:
            recommendations.append(
                DashboardRecommendation(
                    priority="medium",
                    title="Generar diagnostico",
                    message="Genera un score para ver sostenibilidad, alertas y recomendaciones del SaaS.",
                )
            )

        return ProjectDashboardResponse(
            project=self._project_summary(project),
            latest_snapshot=self._latest_snapshot_summary(latest_snapshot),
            latest_score=self._latest_score_summary(latest_score),
            metric_cards=self._metric_cards(calculation),
            alerts=alerts,
            recommendations=recommendations,
            series=await self._project_series(project_id=project_id),
        )

    def _projects_by_stage(self, projects: list[SaasProject]) -> dict[str, int]:
        counts = {stage.value: 0 for stage in SaasStage}
        for project in projects:
            counts[self._enum_value(project.stage)] += 1
        return counts

    def _projects_by_category(self, projects: list[SaasProject]) -> dict[str, int]:
        counts: dict[str, int] = {}
        for project in projects:
            key = self._enum_value(project.category)
            if key:
                counts[key] = counts.get(key, 0) + 1
        return counts

    def _score_project_summary(
        self,
        projects: list[SaasProject],
        score: SaasScore | None,
    ) -> PortfolioProjectSummary | None:
        if score is None:
            return None
        project = next((item for item in projects if item.id == score.saas_project_id), None)
        if project is None:
            return None
        return PortfolioProjectSummary(
            project_id=project.id,
            name=project.name,
            slug=project.slug,
            overall_score=score.overall_score,
            sustainability_level=score.sustainability_level,
        )

    def _high_alert_projects(
        self,
        projects: list[SaasProject],
        scores: list[SaasScore],
    ) -> list[PortfolioAlertProject]:
        summaries: list[PortfolioAlertProject] = []
        for score in scores:
            high_alerts = [
                alert
                for alert in (score.alerts or [])
                if isinstance(alert, dict) and alert.get("severity") == "high"
            ]
            if not high_alerts:
                continue
            project = next((item for item in projects if item.id == score.saas_project_id), None)
            if project is None:
                continue
            summaries.append(
                PortfolioAlertProject(
                    project_id=project.id,
                    name=project.name,
                    slug=project.slug,
                    alerts=high_alerts[:3],
                )
            )
        return summaries[:5]

    def _global_recommendations(
        self,
        *,
        projects: list[SaasProject],
        projects_without_snapshots: int,
        projects_without_scores: int,
        scores: list[SaasScore],
    ) -> list[DashboardRecommendation]:
        recommendations: list[DashboardRecommendation] = []
        if not projects:
            recommendations.append(
                DashboardRecommendation(
                    priority="high",
                    title="Crear primer SaaS",
                    message="Registra tu primer proyecto SaaS para empezar a medir valor y sostenibilidad.",
                )
            )
            return recommendations
        if projects_without_snapshots:
            recommendations.append(
                DashboardRecommendation(
                    priority="high",
                    title="Registrar metricas",
                    message="Hay proyectos sin snapshots; registra metricas para poder analizarlos.",
                )
            )
        if projects_without_scores:
            recommendations.append(
                DashboardRecommendation(
                    priority="medium",
                    title="Generar diagnosticos",
                    message="Hay proyectos sin score; genera diagnosticos para compararlos en el portafolio.",
                )
            )
        risky_count = sum(
            1
            for score in scores
            if self._enum_value(score.sustainability_level)
            in {SustainabilityLevel.RISKY.value, SustainabilityLevel.UNSUSTAINABLE.value}
        )
        if risky_count >= 2:
            recommendations.append(
                DashboardRecommendation(
                    priority="high",
                    title="Priorizar proyectos en riesgo",
                    message="Varios SaaS muestran riesgo; enfoca mejora continua, retencion y estabilidad operativa.",
                )
            )
        insufficient_count = sum(
            1
            for score in scores
            if self._enum_value(score.sustainability_level) == SustainabilityLevel.INSUFFICIENT_DATA.value
        )
        if insufficient_count >= 2:
            recommendations.append(
                DashboardRecommendation(
                    priority="medium",
                    title="Completar datos clave",
                    message="Varios diagnosticos tienen datos insuficientes; completa metricas financieras, usuarios y retencion.",
                )
            )
        return recommendations

    def _project_summary(self, project: SaasProject) -> ProjectSummary:
        return ProjectSummary(
            id=project.id,
            name=project.name,
            slug=project.slug,
            stage=project.stage,
            category=project.category,
            business_model=project.business_model,
            current_price=project.current_price,
            currency=project.currency,
        )

    def _latest_snapshot_summary(self, snapshot) -> LatestSnapshotSummary | None:
        if snapshot is None:
            return None
        return LatestSnapshotSummary(
            id=snapshot.id,
            period_label=snapshot.period_label,
            captured_at=snapshot.captured_at,
        )

    def _latest_score_summary(self, score: SaasScore | None) -> LatestScoreSummary | None:
        if score is None:
            return None
        return LatestScoreSummary(
            overall_score=score.overall_score,
            financial_score=score.financial_score,
            growth_score=score.growth_score,
            retention_score=score.retention_score,
            product_score=score.product_score,
            risk_score=score.risk_score,
            sustainability_level=score.sustainability_level,
            decision_recommendation=score.decision_recommendation,
        )

    def _metric_cards(self, calculation: MetricCalculationResponse | None) -> MetricCards:
        if calculation is None:
            return MetricCards()
        return MetricCards(
            mrr=self._metric_value(calculation, "mrr"),
            arr=self._metric_value(calculation, "arr"),
            monthly_revenue=self._metric_value(calculation, "monthly_revenue"),
            paying_customers=self._metric_value(calculation, "paying_customers"),
            total_users=self._metric_value(calculation, "total_users"),
            active_users=self._metric_value(calculation, "active_users"),
            conversion_rate=self._metric_value(calculation, "conversion_rate"),
            churn_rate=self._metric_value(calculation, "churn_rate"),
            cac=self._metric_value(calculation, "cac"),
            retention_rate=self._metric_value(calculation, "retention_rate"),
            ltv_cac_ratio=self._metric_value(calculation, "ltv_cac_ratio"),
            net_profit=self._metric_value(calculation, "net_profit"),
            arpu=self._metric_value(calculation, "arpu"),
            ltv=self._metric_value(calculation, "ltv"),
            mrr_growth_rate=self._metric_value(calculation, "mrr_growth_rate"),
            runway_months=self._metric_value(calculation, "runway_months"),
            uptime_percentage=self._metric_value(calculation, "uptime_percentage"),
        )

    async def _project_series(self, *, project_id: UUID) -> ProjectSeries:
        snapshots = await self.metric_snapshot_repository.list_recent_by_project(
            saas_project_id=project_id,
            limit=12,
            ascending=True,
        )
        scores = await self.saas_score_repository.list_recent_by_project(
            saas_project_id=project_id,
            limit=12,
            ascending=True,
        )
        return ProjectSeries(
            mrr=self._snapshot_series(snapshots, "mrr"),
            monthly_revenue=self._snapshot_series(snapshots, "monthly_revenue"),
            paying_customers=self._snapshot_series(snapshots, "paying_customers"),
            active_users=self._snapshot_series(snapshots, "active_users"),
            churn_rate=self._snapshot_series(snapshots, "churn_rate"),
            overall_score=[
                SeriesPoint(date=score.created_at, label=None, value=score.overall_score)
                for score in scores
                if score.overall_score is not None
            ],
        )

    def _snapshot_series(self, snapshots: list, field: str) -> list[SeriesPoint]:
        points = []
        for snapshot in snapshots:
            val = getattr(snapshot, field, None)
            if val is None and snapshot.custom_metrics:
                val = snapshot.custom_metrics.get(field)
            if val is not None:
                points.append(
                    SeriesPoint(
                        date=snapshot.captured_at,
                        label=snapshot.period_label,
                        value=val,
                    )
                )
        return points

    def _metric_value(self, calculation: MetricCalculationResponse, key: str):
        metric = calculation.metrics.get(key)
        if metric is None or metric.source == "missing":
            return None
        return metric.value

    def _enum_value(self, value) -> str:
        return value.value if hasattr(value, "value") else str(value)
