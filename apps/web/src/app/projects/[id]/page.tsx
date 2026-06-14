"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit, Database, MessageSquareText, PlusCircle,
  Rocket, Sparkles, TrendingUp, Terminal, ChevronLeft, Info
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject, getProjectDashboard } from "@/features/project-dashboard/api";
import { listAiAnalyses } from "@/features/ai-analyses/api";
import { ProjectHeader } from "@/features/project-dashboard/components/project-header";
import { ProjectScoreCard } from "@/features/project-dashboard/components/project-score-card";
import { ProjectKpiCards, ProjectSecondaryKpiCards } from "@/features/project-dashboard/components/project-kpi-cards";
import { ProjectHistoryChart } from "@/features/project-dashboard/components/project-history-chart";
import { DiagnosticList } from "@/features/project-dashboard/components/diagnostic-lists";
import { generateLatestScore } from "@/features/scoring/api";
import { updateProject, deleteProject } from "@/features/projects/api";
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

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/projects");
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
      <div className="mb-6">
        <Link
          href="/projects"
          className="group relative inline-flex h-10 items-center justify-start gap-3 rounded-lg border-2 border-border/60 bg-card px-3 text-[11px] font-black uppercase tracking-widest text-foreground shadow-[2px_2px_0_rgba(0,0,0,0.2)] hover:border-primary hover:shadow-[4px_4px_0_rgba(var(--primary),0.3)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all active:shadow-none active:translate-x-0 active:translate-y-0"
        >
          <div className="h-6 w-6 bg-primary/10 text-primary flex items-center justify-center rounded-[4px] group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ChevronLeft className="h-4 w-4 shrink-0" />
          </div>
          <span className="mt-0.5 mr-2">../ RETURN_TO_ROOT</span>
        </Link>
      </div>
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
            onDeleteProject={() => deleteMutation.mutate()}
            isDeleting={deleteMutation.isPending}
          />

          {/* Launch success banner */}
          {launchMutation.isSuccess && (
            <div className="flex items-center gap-4 rounded-2xl border border-status-success-border bg-status-success-bg px-6 py-4 animate-in fade-in slide-in-from-bottom-2">
              <Rocket className="h-6 w-6 text-status-success-fg shrink-0" />
              <div>
                <p className="font-bold text-status-success-text">¡Proyecto lanzado con éxito!</p>
                <p className="text-sm text-status-success-text mt-0.5">
                  Ahora puedes registrar métricas reales y hacer un seguimiento completo de tu SaaS.
                </p>
              </div>
            </div>
          )}

          {/* No snapshot yet */}
          {!dashboard.latest_snapshot && (
            <div className={cn(
              "relative overflow-hidden rounded-[24px] border p-10 text-center space-y-5",
              isPlanning
                ? "border-status-warning-fg/30 bg-status-warning-bg/10"
                : "border-primary/30 bg-primary/5"
            )}>
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
              <div className={cn(
                "mx-auto inline-flex rounded-[16px] p-5 shadow-inner border",
                isPlanning ? "bg-status-warning-bg border-status-warning-fg/20" : "bg-card border-primary/20"
              )}>
                {isPlanning
                  ? <Sparkles className="h-10 w-10 text-status-warning-fg" />
                  : <Database className="h-10 w-10 text-primary animate-pulse" />
                }
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-black font-mono tracking-widest text-foreground uppercase">
                  {isPlanning
                    ? "SYS_ERR: Datos No Registrados"
                    : "SYS_ERR: Snapshot Missing"}
                </h3>
                <p className="text-xs font-mono text-muted-foreground mt-3 max-w-md mx-auto uppercase leading-relaxed">
                  {isPlanning
                    ? "> Registra tus primeras estimaciones (caja disponible, costos proyectados) para inicializar el análisis de viabilidad."
                    : "> Registra un corte de métricas para activar cálculos, scores y compilar el historial completo del sistema."}
                </p>
              </div>
              <Link
                href={`/projects/${projectId}/metrics`}
                className={cn(
                  "relative z-10 inline-flex items-center gap-2 rounded-[12px] px-6 py-4 text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95",
                  isPlanning
                    ? "bg-status-warning-fg text-background shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    : "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.2)]"
                )}
              >
                <Terminal className="h-4 w-4" />
                {isPlanning ? "Ingresar Estimaciones" : "Inject_Data"}
              </Link>
            </div>
          )}

          {/* Main content grid: Score + KPIs */}
          {dashboard.latest_snapshot && (
            <div className="space-y-5">
              <div className={cn("flex items-start gap-3 rounded-[12px] border px-4 py-3 shadow-inner", isPlanning ? "border-amber-500/20 bg-amber-500/5" : "border-primary/20 bg-primary/5")}>
                <Info className={cn("h-4 w-4 shrink-0 mt-0.5", isPlanning ? "text-amber-500" : "text-primary")} />
                <p className="text-[11px] font-mono text-muted-foreground uppercase leading-relaxed">
                  <strong className={cn("font-black", isPlanning ? "text-amber-500" : "text-primary")}>SYS_INFO:</strong>
                  {isPlanning ? (
                    <>
                      {" "}Mostrando viabilidad construida a partir del <span className="text-foreground font-bold bg-background/50 px-1.5 py-0.5 rounded-[4px] border border-border/50">último análisis IA</span> y las <span className="text-foreground font-bold bg-background/50 px-1.5 py-0.5 rounded-[4px] border border-border/50">estimaciones más recientes</span> ingresadas.
                    </>
                  ) : (
                    <>
                      {" "}Mostrando evaluación basada en el snapshot del periodo <span className="text-foreground font-bold bg-background/50 px-1.5 py-0.5 rounded-[4px] border border-border/50">{dashboard.latest_snapshot.period_label || new Date(dashboard.latest_snapshot.captured_at).toLocaleDateString()}</span>. 
                      <span className="opacity-80 ml-1">Excepción: Métricas de tendencia (como MRR Growth) evalúan todo el historial disponible para otorgar puntos extra.</span>
                    </>
                  )}
                </p>
              </div>

              <div className={cn(
                "grid gap-5 items-stretch",
                isPlanning ? "xl:grid-cols-[0.9fr_1.1fr]" : "xl:grid-cols-[0.8fr_1.2fr]"
              )}>
                <ProjectScoreCard
                  projectId={projectId}
                  score={dashboard.latest_score}
                  isPlanning={isPlanning}
                  onAiAnalysis={handleAiAnalysisClick}
                  planningAiOutput={dashboard.planning_ai_output}
                />
                
                {isPlanning ? (
                  <div className="flex flex-col gap-5 h-full">
                    <ProjectKpiCards
                      metrics={dashboard.metric_cards}
                      score={dashboard.latest_score?.overall_score}
                      isPlanning={isPlanning}
                      planningAiOutput={dashboard.planning_ai_output}
                    />
                    <ProjectHistoryChart
                      title="Evolución del score de viabilidad"
                      data={dashboard.series.overall_score}
                      color="#f59e0b"
                      isPlanning
                      className="flex-1"
                    />
                  </div>
                ) : (
                  <ProjectKpiCards
                    metrics={dashboard.metric_cards}
                    score={dashboard.latest_score?.overall_score}
                    isPlanning={isPlanning}
                    planningAiOutput={dashboard.planning_ai_output}
                  />
                )}
              </div>
            </div>
          )}

          {/* Secondary KPIs */}
          {dashboard.latest_snapshot && (
            <ProjectSecondaryKpiCards
              metrics={dashboard.metric_cards}
              isPlanning={isPlanning}
            />
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



          {/* Diagnostic alerts and recommendations */}
          {dashboard.latest_snapshot && (
            <div className="grid gap-4 lg:grid-cols-2 items-start">
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
            "relative overflow-hidden rounded-[20px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-6 justify-between shadow-sm",
            isPlanning ? "border-t-4 border-t-status-warning-fg" : "border-t-4 border-t-primary"
          )}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            
            <div className="relative z-10 flex items-start gap-4">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[12px] shadow-inner shrink-0",
                isPlanning ? "bg-status-warning-bg border border-status-warning-fg/30" : "bg-primary/10 border border-primary/30"
              )}>
                {isPlanning
                  ? <Sparkles className="h-6 w-6 text-status-warning-fg" />
                  : <TrendingUp className="h-6 w-6 text-primary" />
                }
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider text-foreground">
                  {isPlanning ? "Valida tu idea antes de invertir" : "¿Qué hacer ahora?"}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground mt-1.5 uppercase leading-relaxed max-w-xl">
                  {isPlanning
                    ? "> Usa el análisis IA para evaluar tu propuesta de valor, modelo de negocio y estrategia de precios."
                    : "> Revisa tu diagnóstico, genera un reporte o conversa con el tutor inteligente."}
                </p>
              </div>
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row gap-3 shrink-0 lg:w-auto w-full">
              {isPlanning ? (
                <>
                  <button
                    onClick={handleAiAnalysisClick}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[12px] bg-status-warning-fg px-5 py-3 text-[11px] font-black uppercase tracking-widest text-background shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <BrainCircuit className="h-4 w-4" />
                    {latestAnalysisId ? "Ver Análisis IA" : "Análisis IA"}
                  </button>
                  <Link
                    href={`/projects/${projectId}/chat`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[12px] border border-border/40 bg-background/50 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-foreground hover:bg-card transition-colors"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Tutor IA
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={`/projects/${projectId}/score`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[12px] bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-widest text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Ver diagnóstico
                  </Link>
                  <Link
                    href={`/projects/${projectId}/chat`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-[12px] border border-border/40 bg-background/50 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-foreground hover:bg-card transition-colors"
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
          projectId={projectId}
          projectStage={project.stage}
          latestSnapshotId={dashboard?.latest_snapshot?.id}
        />
      )}
    </DashboardShell>
  );
}
