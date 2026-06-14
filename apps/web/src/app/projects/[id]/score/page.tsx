"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gauge } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { DiagnosticList } from "@/features/project-dashboard/components/diagnostic-lists";
import { generateLatestScore, getLatestScore, listScores } from "@/features/scoring/api";
import { ScoreOverview } from "@/features/scoring/components/score-overview";
import { ScoreBreakdown } from "@/features/scoring/components/score-breakdown";
import { ScoreHistory } from "@/features/scoring/components/score-history";

export default function ProjectScorePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const queryClient = useQueryClient();

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const latestScoreQuery = useQuery({
    queryKey: ["score", projectId, "latest"],
    queryFn: () => getLatestScore(projectId),
    retry: false,
  });
  const scoreHistoryQuery = useQuery({
    queryKey: ["scores", projectId],
    queryFn: () => listScores(projectId),
  });
  const scoreMutation = useMutation({
    mutationFn: () => generateLatestScore(projectId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["score", projectId, "latest"] }),
        queryClient.invalidateQueries({ queryKey: ["scores", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["project-dashboard", projectId] }),
      ]);
    },
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" />
            Volver al dashboard
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Score</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">
            {projectQuery.data?.name || "Diagnóstico"}
          </h1>
        </div>
        <Button onClick={() => scoreMutation.mutate()} disabled={scoreMutation.isPending}>
          <Gauge className="h-4 w-4" />
          {scoreMutation.isPending ? "Generando..." : "Generar nuevo diagnóstico"}
        </Button>
      </div>

      {projectQuery.isLoading || latestScoreQuery.isLoading || scoreHistoryQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError ? <ErrorState message={getApiErrorMessage(projectQuery.error)} /> : null}
      {scoreMutation.isError ? <ErrorState message={getApiErrorMessage(scoreMutation.error)} /> : null}

      {latestScoreQuery.isError && !latestScoreQuery.data ? (
        <EmptyState
          icon={Gauge}
          title="Aún no hay diagnóstico."
          description="Genera un score a partir del último snapshot registrado. Si faltan métricas, el backend devolverá una explicación."
          actionHref={`/projects/${projectId}/metrics`}
          actionLabel="Revisar métricas"
        />
      ) : null}

      {latestScoreQuery.data ? (
        <div className="space-y-6">
          <ScoreOverview score={latestScoreQuery.data} />
          <ScoreBreakdown score={latestScoreQuery.data} />
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <DiagnosticList title="Fortalezas" items={latestScoreQuery.data.strengths} variant="strength" />
            <DiagnosticList title="Debilidades" items={latestScoreQuery.data.weaknesses} variant="alert" />
            <DiagnosticList title="Alertas" items={latestScoreQuery.data.alerts} variant="alert" />
            <DiagnosticList title="Recomendaciones" items={latestScoreQuery.data.recommendations} />
          </div>
          {scoreHistoryQuery.data ? <ScoreHistory scores={scoreHistoryQuery.data} /> : null}
        </div>
      ) : null}
    </DashboardShell>
  );
}
