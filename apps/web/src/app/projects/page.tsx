"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderPlus, Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatEnum } from "@/lib/utils";
import { listProjects } from "@/features/projects/api";

export default function ProjectsPage() {
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inventario</p>
          <h1 className="mt-1 font-display text-4xl font-semibold">Proyectos SaaS</h1>
        </div>
        <Link href="/projects/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-[#245448]">
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </Link>
      </div>

      {projectsQuery.isLoading ? <LoadingState /> : null}
      {projectsQuery.isError ? <ErrorState message={getApiErrorMessage(projectsQuery.error)} /> : null}
      {projectsQuery.data && projectsQuery.data.items.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="Aun no tienes SaaS registrados."
          description="La lista viene directamente de /saas-projects. Crea el primer proyecto para alimentar dashboards y scores."
          actionHref="/projects/new"
          actionLabel="Crear mi primer SaaS"
        />
      ) : null}
      {projectsQuery.data && projectsQuery.data.items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data.items.map((project) => (
            <Card key={project.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{project.name}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {project.description || "Sin descripcion registrada."}
                  </p>
                </div>
                <Badge className="bg-primary/10 text-primary">{formatEnum(project.stage)}</Badge>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge>{formatEnum(project.category)}</Badge>
                <Badge>{formatEnum(project.business_model)}</Badge>
              </div>
              <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">{formatCurrency(project.current_price, project.currency)}</p>
                <p className="mt-1">Mercado: {project.target_market || "Sin definir"}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </DashboardShell>
  );
}
