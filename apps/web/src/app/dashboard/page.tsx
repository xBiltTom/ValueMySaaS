"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderPlus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getPortfolioDashboard } from "@/features/dashboard/api";
import { PortfolioDashboard } from "@/features/dashboard/components";

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "portfolio"],
    queryFn: getPortfolioDashboard,
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Portafolio</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">Dashboard de sostenibilidad</h1>
        </div>
      </div>

      {dashboardQuery.isLoading ? <LoadingState /> : null}
      {dashboardQuery.isError ? <ErrorState message={getApiErrorMessage(dashboardQuery.error)} /> : null}
      {dashboardQuery.data && dashboardQuery.data.total_projects === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="Aún no tienes SaaS registrados."
          description="Crea tu primer SaaS para empezar a medir valor, sostenibilidad y riesgo."
          actionHref="/projects/new"
          actionLabel="Crear mi primer SaaS"
        />
      ) : null}
      {dashboardQuery.data && dashboardQuery.data.total_projects > 0 ? (
        <PortfolioDashboard data={dashboardQuery.data} />
      ) : null}
    </DashboardShell>
  );
}
