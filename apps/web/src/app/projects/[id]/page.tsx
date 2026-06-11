"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit, Database, MessageSquareText, PlusCircle,
  Rocket, Sparkles, TrendingUp
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject, getProjectDashboard } from "@/features/project-dashboard/api";
import { listAiAnalyses } from "@/features/ai-analyses/api";
import { ProjectHeader } from "@/features/project-dashboard/components/project-header";
import { ProjectScoreCard } from "@/features/project-dashboard/components/project-score-card";
import { ProjectKpiCards } from "@/features/project-dashboard/components/project-kpi-cards";
import { ProjectHistoryChart } from "@/features/project-dashboard/components/project-history-chart";
import { DiagnosticList } from "@/features/project-dashboard/components/diagnostic-lists";
import { generateLatestScore } from "@/features/scoring/api";
import { updateProject } from "@/features/projects/api";
import { AiAnalysisModal } from "@/features/ai-analyses/components/ai-analysis-modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ProjectDashboardPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAiModal, setShowAiModal] = useState(false);

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
  });
  const dashboardQuery = useQuery({
    queryKey: ["project-dashboard", projectId],
    queryFn: () => getProjectDashboard(projectId),
  });
  const analysesQuery = useQuery({
    queryKey: ["ai-analyses", projectId],
    queryFn: () => listAiAnalyses(projectId),
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

  const launchMutation = useMutation({
    mutationFn: () => updateProject(projectId, { stage: "LAUNCHED" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["project-dashboard", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]);
    },
  });

  const project = projectQuery.data;
  const dashboard = dashboardQuery.data;
  const isPlanning = project?.stage === "PLANNING" || project?.stage === "IDEA";
  const latestAnalysisId = analysesQuery.data?.items?.[0]?.id;

  const handleAiAnalysisClick = () => {
    if (latestAnalysisId) {
      router.push(`/projects/${projectId}/ai-analysis/${latestAnalysisId}`);
    } else {
      setShowAiModal(true);
    }
  };

  return (
    <DashboardShell>
      {(projectQuery.isLoading || dashboardQuery.isLoading) ? <LoadingState /> : null}
      {(projectQuery.isError || dashboardQuery.isError) ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || dashboardQuery.error)} />
      ) : null}
      {scoreMutation.isError ? <ErrorState message={getApiErrorMessage(scoreMutation.error)} /> : null}
      {launchMutation.isError ? <ErrorState message={getApiErrorMessage(launchMutation.error)} /> : null}

      {project && dashboard ? (
        <div className="space-y-6">
          {/* Phase-bifurcated header */}
          <ProjectHeader
            project={project}
            onGenerateScore={() => scoreMutation.mutate()}
            isGenerating={scoreMutation.isPending}
            onLaunchProject={() => launchMutation.mutate()}
            isLaunching={launchMutation.isPending}
          />

          {/* Launch success banner */}
          {launchMutation.isSuccess && (
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-6 py-4 animate-in fade-in slide-in-from-bottom-2">
              <Rocket className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900">¡Proyecto lanzado con éxito!</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  Ahora puedes registrar métricas reales y hacer un seguimiento completo de tu SaaS.
                </p>
              </div>
            </div>
          )}

          {/* No snapshot yet */}
          {!dashboard.latest_snapshot && (
            <div className={cn(
              "rounded-3xl border-2 border-dashed p-8 text-center space-y-4",
              isPlanning
                ? "border-amber-200 bg-amber-50/50"
                : "border-primary/20 bg-primary/5"
            )}>
              <div className={cn(
                "mx-auto inline-flex rounded-2xl p-4",
                isPlanning ? "bg-amber-100" : "bg-primary/10"
              )}>
                {isPlanning
                  ? <Sparkles className="h-8 w-8 text-amber-600" />
                  : <Database className="h-8 w-8 text-primary" />
                }
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {isPlanning
                    ? "Aún no hay datos registrados"
                    : "Sin snapshots de métricas"}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  {isPlanning
                    ? "Registra tus primeras estimaciones (caja disponible, costos proyectados) para comenzar el análisis de viabilidad."
                    : "Registra un corte de métricas para activar cálculos, score y el dashboard histórico."}
                </p>
              </div>
              <Link
                href={`/projects/${projectId}/metrics`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:scale-105",
                  isPlanning
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-primary text-white hover:bg-primary/90"
                )}
              >
                <PlusCircle className="h-4 w-4" />
                {isPlanning ? "Registrar estimaciones" : "Registrar métricas"}
              </Link>
            </div>
          )}

          {/* Main content grid: Score + KPIs */}
          {dashboard.latest_snapshot && (
            <div className={cn(
              "grid gap-5",
              isPlanning ? "xl:grid-cols-[0.9fr_1.1fr]" : "xl:grid-cols-[0.8fr_1.2fr]"
            )}>
              <ProjectScoreCard
                projectId={projectId}
                score={dashboard.latest_score}
                isPlanning={isPlanning}
                onAiAnalysis={handleAiAnalysisClick}
              />
              <ProjectKpiCards
                metrics={dashboard.metric_cards}
                score={dashboard.latest_score?.overall_score}
                isPlanning={isPlanning}
              />
            </div>
          )}

          {/* Charts section */}
          {dashboard.latest_snapshot && !isPlanning && (
            <div className="grid gap-5 xl:grid-cols-3">
              <ProjectHistoryChart
                title="MRR histórico"
                data={dashboard.series.mrr}
                color="#4f46e5"
              />
              <ProjectHistoryChart
                title="Usuarios activos"
                data={dashboard.series.active_users}
                color="#0ea5e9"
              />
              <ProjectHistoryChart
                title="Churn rate"
                data={dashboard.series.churn_rate}
                color="#f43f5e"
              />
            </div>
          )}

          {/* Planning: single score evolution chart */}
          {dashboard.latest_snapshot && isPlanning && (
            <ProjectHistoryChart
              title="Evolución del score de viabilidad"
              data={dashboard.series.overall_score}
              color="#f59e0b"
              isPlanning
            />
          )}

          {/* Diagnostic alerts and recommendations */}
          {dashboard.latest_snapshot && (
            <div className="grid gap-4 lg:grid-cols-2">
              <DiagnosticList
                title="Alertas Críticas"
                items={dashboard.alerts}
                variant="alert"
                isPlanning={isPlanning}
              />
              <DiagnosticList
                title="Recomendaciones"
                items={dashboard.recommendations}
                variant="recommendation"
                isPlanning={isPlanning}
              />
            </div>
          )}

          {/* Bottom CTA strip */}
          <div className={cn(
            "rounded-3xl border p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            isPlanning
              ? "border-amber-200/60 bg-gradient-to-r from-amber-50 to-violet-50"
              : "border-primary/15 bg-gradient-to-r from-primary/5 to-teal-50/50"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "rounded-2xl p-3 shrink-0",
                isPlanning ? "bg-amber-100" : "bg-primary/10"
              )}>
                {isPlanning
                  ? <Sparkles className="h-5 w-5 text-amber-600" />
                  : <TrendingUp className="h-5 w-5 text-primary" />
                }
              </div>
              <div>
                <p className="font-bold text-foreground">
                  {isPlanning ? "Valida tu idea antes de invertir" : "¿Qué hacer ahora?"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isPlanning
                    ? "Usa el análisis IA para evaluar tu propuesta de valor, modelo de negocio y estrategia de precios."
                    : "Revisa tu diagnóstico, genera un reporte o conversa con el tutor inteligente."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {isPlanning ? (
                <>
                  <button
                    onClick={handleAiAnalysisClick}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700 transition-colors"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    {latestAnalysisId ? "Ver Análisis IA" : "Análisis IA"}
                  </button>
                  <Link
                    href={`/projects/${projectId}/chat`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Tutor IA
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={`/projects/${projectId}/score`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Ver diagnóstico
                  </Link>
                  <Link
                    href={`/projects/${projectId}/chat`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold hover:bg-muted transition-colors"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Chat con el SaaS
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {project && (
        <AiAnalysisModal 
          isOpen={showAiModal} 
          onClose={() => setShowAiModal(false)} 
          projectId={project.id} 
          projectStage={project.stage} 
        />
      )}
    </DashboardShell>
  );
}
