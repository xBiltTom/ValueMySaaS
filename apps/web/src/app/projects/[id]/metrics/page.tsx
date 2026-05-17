"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { listMetricSnapshots, getLatestMetricCalculation } from "@/features/metrics/api";
import { MetricSnapshotForm } from "@/features/metrics/components/metric-snapshot-form";
import { MetricSnapshotList } from "@/features/metrics/components/metric-snapshot-list";
import { MetricCalculationPanel } from "@/features/metrics/components/metric-calculation-panel";

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

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Metricas</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">
          {projectQuery.data?.name || "Registrar metricas"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Captura snapshots reales para alimentar calculos, score y mejora continua.
        </p>
      </div>

      {projectQuery.isLoading || snapshotsQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError || snapshotsQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || snapshotsQuery.error)} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MetricSnapshotForm projectId={projectId} />
        <div className="space-y-6">
          {snapshotsQuery.data ? <MetricSnapshotList snapshots={snapshotsQuery.data} /> : null}
          {calculationQuery.data ? <MetricCalculationPanel calculation={calculationQuery.data} /> : null}
          {calculationQuery.isError && snapshotsQuery.data?.items.length ? (
            <ErrorState title="Calculos no disponibles" message={getApiErrorMessage(calculationQuery.error)} />
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
