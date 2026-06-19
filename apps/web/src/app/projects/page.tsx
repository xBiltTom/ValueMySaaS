"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, FolderPlus, Plus, Globe, Trash2, TerminalSquare, Cpu, Activity, Database, HelpCircle } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrency, formatEnum } from "@/lib/utils";
import { listProjects, deleteProject } from "@/features/projects/api";
import { TutorialTrigger } from "@/features/tutorial/components/tutorial-trigger";
import { startTour } from "@/features/tutorial/config";

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
      <TutorialTrigger modules={["projectsList"]} />
      <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Background ambient effect */}
        <div className="absolute top-0 left-0 w-full h-[300px] bg-[linear-gradient(to_right,rgba(150,150,150,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,150,150,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_100%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

        <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end relative">
          <div id="tour-projects-list-header">
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
              <Database className="h-3 w-3 text-accent" />
              Inventario Activo
            </div>
            <div className="flex items-start gap-4">
              <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl md:text-6xl flex items-center gap-4">
                <FolderPlus className="hidden sm:block h-10 w-10 text-primary opacity-80" />
                SaaS Instances
              </h1>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => startTour("projectsList")}
                className="hidden sm:flex border-primary/50 text-primary hover:bg-primary/10 gap-2 font-mono uppercase text-[10px] font-black tracking-widest mt-2"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Guía
              </Button>
            </div>
          </div>
          <Link
            id="tour-deploy-new-btn"
            href="/projects/new"
            className="inline-flex h-12 lg:h-14 items-center justify-center gap-2 rounded-[16px] bg-foreground px-6 text-sm font-black uppercase tracking-wider text-background shadow-[0_10px_30px_rgba(var(--foreground),0.2)] transition-all hover:scale-105 hover:-rotate-2 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Deploy Nuevo
          </Link>
        </div>

        {projectsQuery.isLoading ? <LoadingState /> : null}
        {projectsQuery.isError ? (
          <ErrorState message={getApiErrorMessage(projectsQuery.error)} />
        ) : null}

        {projectsQuery.data && projectsQuery.data.items.length === 0 ? (
          <div className="mt-12 relative overflow-hidden rounded-[32px] border border-border/40 bg-card/30 backdrop-blur-xl p-1 shadow-[0_0_40px_rgba(0,0,0,0.03)] group">
            <div className="absolute -right-20 -top-20 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-700 pointer-events-none">
              <TerminalSquare className="w-96 h-96" />
            </div>
            <div className="bg-background/80 rounded-[28px] p-8 sm:p-16">
              <EmptyState
                icon={TerminalSquare}
                title="NODE SYSTEM VACÍO"
                description="El clúster está vacío. Despliega tu primer SaaS para empezar a medir viabilidad y tracción de mercado."
                actionHref="/projects/new"
                actionLabel="Inicializar Nodo"
              />
            </div>
          </div>
        ) : null}

        {projectsQuery.data && projectsQuery.data.items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {projectsQuery.data.items.map((project, index) => (
              <div key={project.id} className={`group relative animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-500 fill-mode-both`} style={{ animationDelay: `${index * 50}ms` }}>
                <Link
                  href={`/projects/${project.id}`}
                  className="block h-full relative overflow-hidden rounded-[24px] border border-border/40 bg-card/60 backdrop-blur-xl p-6 transition-all hover:border-primary/50 hover:bg-card hover:shadow-[0_0_30px_rgba(var(--primary),0.1)] hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 transition-opacity group-hover:opacity-10 pointer-events-none">
                    <Cpu className="w-32 h-32" />
                  </div>

                  <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex h-2 w-2 items-center justify-center">
                        <span className="absolute h-2 w-2 animate-ping rounded-full bg-accent opacity-75"></span>
                        <span className="relative h-2 w-2 rounded-full bg-accent"></span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">ONLINE</span>
                    </div>
                    
                    <Badge className="border-primary/30 bg-primary/20 text-[9px] font-black uppercase tracking-widest text-primary shadow-sm">
                      {formatEnum(project.stage)}
                    </Badge>
                  </div>

                  <div className="mb-5 relative z-10">
                    <h2 className="font-display text-2xl font-black text-foreground tracking-tight transition-colors group-hover:text-primary">
                      {project.name}
                    </h2>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground line-clamp-2 min-h-[40px]">
                      {project.description || "Sin descripción de modelo registrada en el sistema."}
                    </p>
                  </div>

                  <div className="mb-6 flex flex-wrap gap-2 relative z-10">
                    <span className="px-2.5 py-1 rounded-[8px] bg-background/50 border border-border/50 text-[10px] font-bold uppercase tracking-wider text-foreground">
                      {formatEnum(project.category)}
                    </span>
                    <span className="px-2.5 py-1 rounded-[8px] bg-background/50 border border-border/50 text-[10px] font-bold uppercase tracking-wider text-foreground">
                      {formatEnum(project.business_model)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-4 relative z-10">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Precio / MRR Target</p>
                      <div className="flex items-center gap-1 font-display text-xl font-bold text-foreground">
                        <DollarSign className="h-4 w-4 text-accent" />
                        {formatCurrency(project.current_price, project.currency)}
                        <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground font-sans">/mo</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Mercado</p>
                      <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-foreground">
                        <Globe className="h-3.5 w-3.5 text-primary opacity-80" />
                        <span className="truncate max-w-[100px]">{project.target_market || "Global"}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteConfirm({ id: project.id, name: project.name });
                  }}
                  className="absolute -top-3 -right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/80 backdrop-blur-md text-muted-foreground transition-all hover:bg-destructive hover:border-destructive/50 hover:text-destructive-foreground hover:scale-110 shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  title="Eliminar instancia"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="border border-destructive/30 bg-background/95 backdrop-blur-xl sm:rounded-[24px] p-6 sm:p-8 shadow-[0_0_50px_rgba(var(--destructive),0.15)]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-black text-foreground flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              Purge Instance
            </DialogTitle>
            <DialogDescription className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
              Estás a punto de ejecutar la destrucción total del nodo <strong className="text-foreground font-black px-1.5 py-0.5 bg-muted rounded-md">{deleteConfirm?.name}</strong>.
              <br /><br />
              Esta acción es irreversible y eliminará en cascada todos sus diagnósticos, métricas, logs y reportes generados. ¿Confirmas la purga?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <Button variant="ghost" className="rounded-[12px] font-bold text-[13px] h-11" onClick={() => setDeleteConfirm(null)} disabled={deleteMutation.isPending}>
              Abortar
            </Button>
            <Button
              variant="danger"
              className="rounded-[12px] font-bold text-[13px] h-11 shadow-[0_0_15px_rgba(var(--destructive),0.4)]"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Ejecutando Purga..." : "Confirmar Destrucción"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
