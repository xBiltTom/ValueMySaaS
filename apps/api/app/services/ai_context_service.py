from uuid import UUID

from fastapi import HTTPException, status

from app.repositories.metric_snapshot_repository import MetricSnapshotRepository
from app.repositories.saas_project_repository import SaasProjectRepository
from app.repositories.saas_score_repository import SaasScoreRepository
from app.services.dashboard_service import DashboardService


class AiContextService:
    def __init__(
        self,
        saas_project_repository: SaasProjectRepository,
        metric_snapshot_repository: MetricSnapshotRepository,
        saas_score_repository: SaasScoreRepository,
        dashboard_service: DashboardService,
    ) -> None:
        self.saas_project_repository = saas_project_repository
        self.metric_snapshot_repository = metric_snapshot_repository
        self.saas_score_repository = saas_score_repository
        self.dashboard_service = dashboard_service

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
        latest_snapshot = await self.metric_snapshot_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        latest_score = await self.saas_score_repository.get_latest_by_project(
            saas_project_id=project_id,
        )
        limitations: list[str] = []
        if latest_snapshot is None:
            limitations.append("No hay snapshot de metricas registrado.")
        if latest_score is None:
            limitations.append("No hay score de sostenibilidad persistido.")

        return {
            "project": dashboard.project.model_dump(mode="json"),
            "latest_snapshot": dashboard.latest_snapshot.model_dump(mode="json") if dashboard.latest_snapshot else None,
            "latest_score": dashboard.latest_score.model_dump(mode="json") if dashboard.latest_score else None,
            "metric_cards": dashboard.metric_cards.model_dump(mode="json"),
            "alerts": dashboard.alerts,
            "recommendations": [
                item.model_dump(mode="json") if hasattr(item, "model_dump") else item
                for item in dashboard.recommendations
            ],
            "series": dashboard.series.model_dump(mode="json"),
            "data_quality": {
                "has_snapshot": latest_snapshot is not None,
                "has_score": latest_score is not None,
                "limitations": limitations,
            },
        }
