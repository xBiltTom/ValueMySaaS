"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FolderPlus, Plus, TrendingUp, DollarSign } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
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
      <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
            Inventario
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Proyectos SaaS</h1>
        </div>
        <Link href="/projects/new" className="btn-premium inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_0_15px_var(--ring)]">
          <Plus className="h-5 w-5" />
          Nuevo proyecto
        </Link>
      </div>

      {projectsQuery.isLoading ? <LoadingState /> : null}
      {projectsQuery.isError ? <ErrorState message={getApiErrorMessage(projectsQuery.error)} /> : null}
      
      {projectsQuery.data && projectsQuery.data.items.length === 0 ? (
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
      
      {projectsQuery.data && projectsQuery.data.items.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data.items.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block group">
              <div className="bento-card h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(204,255,0,0.15)] hover:border-primary/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">{project.name}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {project.description || "Sin descripción registrada."}
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0 uppercase tracking-wider text-[10px] font-bold">
                    {formatEnum(project.stage)}
                  </Badge>
                </div>
                
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-card text-xs font-semibold border-border">{formatEnum(project.category)}</Badge>
                  <Badge variant="outline" className="bg-card text-xs font-semibold border-border">{formatEnum(project.business_model)}</Badge>
                </div>
                
                <div className="mt-6 flex items-center justify-between border-t border-border pt-5 text-sm">
                  <div className="flex items-center text-foreground font-bold font-display text-lg">
                    <DollarSign className="h-4 w-4 text-accent mr-1" />
                    {formatCurrency(project.current_price, project.currency)}
                    <span className="text-xs text-muted-foreground ml-1 font-sans font-normal">/mo</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-xs font-semibold">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {project.target_market || "Mercado Global"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </DashboardShell>
  );
}
