"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, FolderPlus, Plus, TrendingUp, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatEnum } from "@/lib/utils";
import { listProjects, deleteProject } from "@/features/projects/api";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, name: string} | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteConfirm(null);
    },
  });

  return (
    <DashboardShell>
      <div className="animate-page-in">
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-accent" />
            Inventario
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Proyectos SaaS
          </h1>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nuevo proyecto
        </Link>
      </div>

      {projectsQuery.isLoading ? <LoadingState /> : null}
      {projectsQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectsQuery.error)} />
      ) : null}

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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projectsQuery.data.items.map((project, index) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={`group block animate-card-${Math.min(index + 1, 4) as 1 | 2 | 3 | 4}`}
            >
              <div className="bento-card h-full p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                      {project.name}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {project.description || "Sin descripción registrada."}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className="shrink-0 border-primary/20 bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {formatEnum(project.stage)}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteConfirm({ id: project.id, name: project.name });
                      }}
                      className="rounded-full p-1.5 text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Eliminar proyecto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge>{formatEnum(project.category)}</Badge>
                  <Badge>{formatEnum(project.business_model)}</Badge>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                  <div className="flex items-center gap-1 font-display text-lg font-bold text-foreground">
                    <DollarSign className="h-4 w-4 text-accent" />
                    {formatCurrency(project.current_price, project.currency)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground font-sans">/mo</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {project.target_market || "Mercado Global"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
      </div>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proyecto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente el proyecto <strong>{deleteConfirm?.name}</strong>?
              Esta acción no se puede deshacer e incluirá la eliminación de todos sus análisis, historiales y reportes.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar proyecto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
