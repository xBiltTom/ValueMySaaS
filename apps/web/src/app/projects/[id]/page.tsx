"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject, getProjectDashboard } from "@/features/project-dashboard/api";
import { ProjectHeader } from "@/features/project-dashboard/components/project-header";
import { ProjectScoreCard } from "@/features/project-dashboard/components/project-score-card";
import { ProjectKpiCards } from "@/features/project-dashboard/components/project-kpi-cards";
import { ProjectHistoryChart } from "@/features/project-dashboard/components/project-history-chart";
import { DiagnosticList } from "@/features/project-dashboard/components/diagnostic-lists";
import { generateLatestScore } from "@/features/scoring/api";

export default function ProjectDashboardPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const queryClient = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });
  const dashboardQuery = useQuery({
    queryKey: ["project-dashboard", projectId],
    queryFn: () => getProjectDashboard(projectId),
  });
  const scoreMutation = useMutation({
    mutationFn: () => generateLatestScore(projectId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project-dashboard", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["scores", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["score", projectId, "latest"] }),
      ]);
    },
  });

  return (
    <DashboardShell>
      {(projectQuery.isLoading || dashboardQuery.isLoading) ? <LoadingState /> : null}
      {(projectQuery.isError || dashboardQuery.isError) ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || dashboardQuery.error)} />
      ) : null}

      {projectQuery.data && dashboardQuery.data ? (
        <div className="space-y-6">
          <ProjectHeader
            project={projectQuery.data}
            onGenerateScore={() => scoreMutation.mutate()}
            isGenerating={scoreMutation.isPending}
          />
          {scoreMutation.isError ? <ErrorState message={getApiErrorMessage(scoreMutation.error)} /> : null}

          {!dashboardQuery.data.latest_snapshot ? (
            <EmptyState
              icon={Database}
              title="Aun no hay snapshots para este SaaS."
              description="Registra metricas para activar calculos, graficas historicas y diagnostico de sostenibilidad."
              actionHref={`/projects/${projectId}/metrics`}
              actionLabel="Registrar metricas"
            />
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
            <ProjectScoreCard projectId={projectId} score={dashboardQuery.data.latest_score} />
            <ProjectKpiCards metrics={dashboardQuery.data.metric_cards} score={dashboardQuery.data.latest_score?.overall_score} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <ProjectHistoryChart title="MRR historico" data={dashboardQuery.data.series.mrr} />
            <ProjectHistoryChart title="Usuarios activos" data={dashboardQuery.data.series.active_users} color="#d8753a" />
            <ProjectHistoryChart title="Churn rate" data={dashboardQuery.data.series.churn_rate} color="#b42318" />
            <ProjectHistoryChart title="Score general" data={dashboardQuery.data.series.overall_score} color="#2f6f60" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DiagnosticList title="Alertas" items={dashboardQuery.data.alerts} variant="alert" />
            <DiagnosticList title="Recomendaciones" items={dashboardQuery.data.recommendations} />
          </div>

          <div className="rounded-lg border border-border bg-[#fbf8f1] p-5">
            <p className="text-sm text-muted-foreground">
              Siguiente paso natural: revisar el{" "}
              <Link href={`/projects/${projectId}/score`} className="font-semibold text-primary">diagnostico completo</Link>
              {", generar "}
              <Link href={`/projects/${projectId}/reports`} className="font-semibold text-primary">reportes</Link>
              {" "}o registrar otro corte de metricas para comparar evolucion.
            </p>
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
