"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lightbulb, BarChart3, Info } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { listMetricSnapshots, getLatestMetricCalculation } from "@/features/metrics/api";
import { MetricSnapshotForm } from "@/features/metrics/components/metric-snapshot-form";
import { MetricSnapshotList } from "@/features/metrics/components/metric-snapshot-list";
import { MetricCalculationPanel } from "@/features/metrics/components/metric-calculation-panel";
import { cn } from "@/lib/utils";

export default function ProjectMetricsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const snapshotsQuery = useQuery({
    queryKey: ["metric-snapshots", projectId],
    queryFn: () => listMetricSnapshots(projectId),
  });
  const calculationQuery = useQuery({
    queryKey: ["metric-calculations", projectId, "latest"],
    queryFn: () => getLatestMetricCalculation(projectId),
    enabled: Boolean(snapshotsQuery.data?.items.length),
    retry: false,
  });

  const project = projectQuery.data;
  const isPlanning = project?.stage === "PLANNING" || project?.stage === "IDEA";

  return (
    <DashboardShell>
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors bg-background/50 border border-border/40 px-3 py-1.5 rounded-[8px]"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver a dashboard
        </Link>
      </div>

      {/* Page header */}
      <div className={cn(
        "relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 md:p-8 mb-8 shadow-sm",
        isPlanning ? "border-t-4 border-t-status-warning-fg" : "border-t-4 border-t-primary"
      )}>
        {/* Background scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />

        <div className="relative z-10 flex items-start gap-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-[12px] shadow-inner shrink-0",
            isPlanning ? "bg-status-warning-bg border border-status-warning-fg/30" : "bg-primary/10 border border-primary/30"
          )}>
            {isPlanning
              ? <Lightbulb className="h-6 w-6 text-status-warning-fg" />
              : <BarChart3 className="h-6 w-6 text-primary" />
            }
          </div>
          <div className="flex-1">
            <p className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", isPlanning ? "text-status-warning-text" : "text-primary")}>
              <span className={cn("h-2 w-2 rounded-full animate-pulse", isPlanning ? "bg-status-warning-fg" : "bg-primary")}></span>
              {isPlanning ? "SYS_MODE: PLANNING_ESTIMATES" : "SYS_MODE: LIVE_METRICS"}
            </p>
            <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-foreground">
              {project?.name || "CARGANDO_DATOS..."}
            </h1>
            <p className="mt-2 text-[12px] font-mono text-muted-foreground uppercase leading-relaxed max-w-2xl">
              {isPlanning
                ? "> Registra tus costos estimados. La evaluación de viabilidad la hace la IA en base a tu propuesta de valor, no en base a números reales."
                : "> Registra snapshots de métricas reales para alimentar el score diagnóstico, gráficos históricos y análisis de IA."}
            </p>
          </div>
        </div>

        {isPlanning && (
          <div className="relative z-10 mt-6 flex items-start gap-3 rounded-[12px] border border-status-warning-border/60 bg-status-warning-bg/70 px-4 py-3 shadow-inner">
            <Info className="h-4 w-4 text-status-warning-fg shrink-0 mt-0.5" />
            <p className="text-[11px] font-mono text-status-warning-text leading-relaxed uppercase">
              <strong>¿Por qué solo costos?</strong> En planeación, los proyectos aún no tienen usuarios ni ingresos reales.
              El análisis de IA evalúa tu idea usando tu propuesta de valor, mercado objetivo y modelo de negocio.
              Cuando lances el proyecto, tendrás acceso a métricas completas como MRR, churn rate y más.
            </p>
          </div>
        )}
      </div>

      {projectQuery.isLoading || snapshotsQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError || snapshotsQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || snapshotsQuery.error)} />
      ) : null}

      <div className={cn(
        "grid gap-6",
        isPlanning ? "xl:grid-cols-1 max-w-2xl" : "xl:grid-cols-[1.1fr_0.9fr]"
      )}>
        {project ? (
          <MetricSnapshotForm projectId={projectId} projectStage={project.stage} />
        ) : <div />}

        {!isPlanning && (
          <div className="space-y-6">
            {snapshotsQuery.data ? <MetricSnapshotList snapshots={snapshotsQuery.data} /> : null}
            {calculationQuery.data ? (
              <MetricCalculationPanel calculation={calculationQuery.data} projectStage={project?.stage} />
            ) : null}
            {calculationQuery.isError && snapshotsQuery.data?.items.length ? (
              <ErrorState title="Cálculos no disponibles" message={getApiErrorMessage(calculationQuery.error)} />
            ) : null}
          </div>
        )}

        {isPlanning && snapshotsQuery.data?.items.length ? (
          <div>
            <MetricSnapshotList snapshots={snapshotsQuery.data} />
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
