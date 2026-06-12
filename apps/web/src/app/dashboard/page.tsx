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
      <div className="animate-page-in">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
          Portafolio
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Dashboard de Sostenibilidad
        </h1>
      </div>

      {dashboardQuery.isLoading ? <LoadingState /> : null}
      {dashboardQuery.isError ? (
        <ErrorState message={getApiErrorMessage(dashboardQuery.error)} />
      ) : null}

      {dashboardQuery.data && dashboardQuery.data.total_projects === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={FolderPlus}
            title="Aún no tienes SaaS registrados."
            description="Crea tu primer SaaS para empezar a medir valor, sostenibilidad y riesgo."
            actionHref="/projects/new"
            actionLabel="Crear mi primer SaaS"
          />
        </div>
      ) : null}

      {dashboardQuery.data && dashboardQuery.data.total_projects > 0 ? (
        <PortfolioDashboard data={dashboardQuery.data} />
      ) : null}
      </div>
    </DashboardShell>
  );
}
