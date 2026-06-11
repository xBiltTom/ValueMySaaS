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
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al dashboard
        </Link>
      </div>

      {/* Page header */}
      <div className={cn(
        "rounded-3xl border p-6 md:p-8 mb-8",
        isPlanning
          ? "border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-orange-50"
          : "border-primary/15 bg-gradient-to-br from-indigo-50 via-white to-violet-50"
      )}>
        <div className="flex items-start gap-4">
          <div className={cn("rounded-2xl p-4 shrink-0", isPlanning ? "bg-amber-100" : "bg-primary/10")}>
            {isPlanning
              ? <Lightbulb className="h-7 w-7 text-amber-600" />
              : <BarChart3 className="h-7 w-7 text-primary" />
            }
          </div>
          <div>
            <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", isPlanning ? "text-amber-600" : "text-primary")}>
              {isPlanning ? "Estimaciones · Planeación" : "Métricas · En marcha"}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {project?.name || "Cargando..."}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {isPlanning
                ? "Registra tus costos estimados. La evaluación de viabilidad la hace la IA en base a tu propuesta de valor, no en base a números reales."
                : "Registra snapshots de métricas reales para alimentar el score diagnóstico, gráficos históricos y análisis de IA."}
            </p>
          </div>
        </div>

        {isPlanning && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-300/60 bg-white/70 px-4 py-3">
            <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
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
