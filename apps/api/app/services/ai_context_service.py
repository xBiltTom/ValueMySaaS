"""Servicio que construye el contexto completo del proyecto para el LLM.

Incluye el historial completo de snapshots de métricas y scores, de modo que
el modelo tenga acceso a toda la evolución temporal del proyecto.
"""
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status

from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.repositories.user_repository import UserRepository
from app.services.dashboard_service import DashboardService


class AiContextService:
    def __init__(
        self,
        saas_project_repository: SaasProjectRepository,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_score_repository: SaasScoreRepository,
        dashboard_service: DashboardService,
        user_repository: UserRepository,
    ) -> None:
        self.saas_project_repository = saas_project_repository
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_score_repository = saas_score_repository
        self.dashboard_service = dashboard_service
        self.user_repository = user_repository

    async def build_context(self, *, project_id: UUID, owner_id: UUID) -> dict:
        project = await self.saas_project_repository.get_by_id_for_owner(
            project_id=project_id,
            owner_id=owner_id,
        )
        if project is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SaaS project not found")

        dashboard = await self.dashboard_service.get_project_dashboard(
            project_id=project_id,
            owner_id=owner_id,
        )
        
        user = await self.user_repository.get_by_id(owner_id)

        # Fetch FULL history: all snapshots and all scores (up to 50 each to provide maximum context to powerful models)
        all_snapshots = await self.metric_snapshot_repository.list_by_project(
            saas_project_id=project_id,
            limit=50,
            offset=0,
        )
        # Sort chronologically (oldest first) for easy comparison
        all_snapshots_sorted = sorted(all_snapshots, key=lambda s: s.captured_at)

        all_scores = await self.saas_score_repository.list_by_project(
            saas_project_id=project_id,
            limit=50,
            offset=0,
        )
        all_scores_sorted = sorted(all_scores, key=lambda s: s.created_at)

        limitations: list[str] = []
        if not all_snapshots:
            limitations.append("No hay snapshots de métricas registrados.")
        if not all_scores:
            limitations.append("No hay scores de sostenibilidad persistidos.")

        def _snapshot_to_dict(s) -> dict:
            return {
                "id": str(s.id),
                "period_label": s.period_label,
                "captured_at": s.captured_at.isoformat() if s.captured_at else None,
                "mrr": float(s.mrr) if s.mrr is not None else None,
                "monthly_costs": float(s.monthly_costs) if s.monthly_costs is not None else None,
                "total_users": s.total_users,
                "paying_customers": s.paying_customers,
                "cac": float(s.cac) if s.cac is not None else None,
                "churn_rate": float(s.churn_rate) if s.churn_rate is not None else None,
                "custom_metrics": s.custom_metrics or {},
                "notes": s.notes,
            }

        def _score_to_dict(s) -> dict:
            return {
                "id": str(s.id),
                "metric_snapshot_id": str(s.metric_snapshot_id) if s.metric_snapshot_id else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "overall_score": float(s.overall_score) if s.overall_score is not None else None,
                "financial_score": float(s.financial_score) if s.financial_score is not None else None,
                "growth_score": float(s.growth_score) if s.growth_score is not None else None,
                "retention_score": float(s.retention_score) if s.retention_score is not None else None,
                "product_score": float(s.product_score) if s.product_score is not None else None,
                "risk_score": float(s.risk_score) if s.risk_score is not None else None,
                "sustainability_level": s.sustainability_level.value if s.sustainability_level else None,
                "decision_recommendation": s.decision_recommendation.value if s.decision_recommendation else None,
                "strengths": s.strengths or [],
                "weaknesses": s.weaknesses or [],
                "alerts": s.alerts or [],
                "recommendations": s.recommendations or [],
            }

        latest_snapshot = all_snapshots_sorted[-1] if all_snapshots_sorted else None
        latest_score = all_scores_sorted[-1] if all_scores_sorted else None

        return {
            "user": {
                "name": user.full_name or user.email.split("@")[0],
            } if user else None,
            "project": dashboard.project.model_dump(mode="json"),
            # Latest summary for quick reference
            "latest_snapshot": dashboard.latest_snapshot.model_dump(mode="json") if dashboard.latest_snapshot else None,
            "latest_score": dashboard.latest_score.model_dump(mode="json") if dashboard.latest_score else None,
            # Full historical data — all snapshots ordered chronologically
            "snapshot_history": [_snapshot_to_dict(s) for s in all_snapshots_sorted],
            # Full historical scores ordered chronologically
            "score_history": [_score_to_dict(s) for s in all_scores_sorted],
            # Dashboard computed metrics and recommendations
            "metric_cards": dashboard.metric_cards.model_dump(mode="json"),
            "alerts": dashboard.alerts,
            "recommendations": [
                item.model_dump(mode="json") if hasattr(item, "model_dump") else item
                for item in dashboard.recommendations
            ],
            "series": dashboard.series.model_dump(mode="json"),
            "data_quality": {
                "total_snapshots": len(all_snapshots),
                "total_scores": len(all_scores),
                "has_snapshot": latest_snapshot is not None,
                "has_score": latest_score is not None,
                "limitations": limitations,
            },
        }
