"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lightbulb, BarChart3, Info, Database, X } from "lucide-react";
import { useState, useEffect } from "react";
import { MetricSnapshot } from "@/features/metrics/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { listMetricSnapshots } from "@/features/metrics/api";
import { MetricSnapshotForm } from "@/features/metrics/components/metric-snapshot-form";
import { MetricSnapshotList } from "@/features/metrics/components/metric-snapshot-list";
import { cn } from "@/lib/utils";

export default function ProjectMetricsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<MetricSnapshot | null>(null);
  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const snapshotsQuery = useQuery({
    queryKey: ["metric-snapshots", projectId],
    queryFn: () => listMetricSnapshots(projectId),
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
        "relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 md:p-8 mb-8 shadow-sm shrink-0",
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
        "flex flex-col xl:flex-row gap-8 items-start relative w-full",
        isPlanning ? "max-w-2xl" : ""
      )}>
        {/* Left Column (Inputs) */}
        <div className="flex-1 w-full xl:max-h-[calc(100vh-280px)] xl:overflow-y-auto xl:pr-4 custom-scrollbar xl:sticky xl:top-6">
          {project ? (
            <MetricSnapshotForm 
              projectId={projectId} 
              projectStage={project.stage} 
              editingSnapshot={editingSnapshot}
              onCancelEdit={() => setEditingSnapshot(null)}
            />
          ) : <div />}
          
          {isPlanning && snapshotsQuery.data?.items.length ? (
            <div className="mt-8">
              <MetricSnapshotList 
                snapshots={snapshotsQuery.data} 
                projectId={projectId} 
                onEdit={(snapshot) => setEditingSnapshot(snapshot)}
              />
            </div>
          ) : null}
        </div>

        {/* Right Column (DATA_LOG_HISTORY & Calc) */}
        {!isPlanning && (
          <>
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="xl:hidden fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[4px_4px_0_rgba(0,0,0,0.5)] border-2 border-primary-foreground transition-transform active:translate-y-1"
            >
              <Database className="h-6 w-6" />
            </button>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm xl:hidden transition-opacity duration-300"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar / Right Column */}
            <div className={cn(
              "fixed inset-y-0 right-0 z-50 w-full max-w-[380px] bg-card border-l-2 border-border/60 p-6 shadow-2xl transition-transform duration-300 ease-in-out xl:static xl:w-[400px] 2xl:w-[450px] xl:shrink-0 xl:h-[calc(100vh-280px)] xl:overflow-y-auto xl:bg-transparent xl:border-none xl:p-0 xl:shadow-none custom-scrollbar xl:sticky xl:top-6",
              isSidebarOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"
            )}>
              {/* Mobile Close Button */}
              <div className="flex items-center justify-between mb-6 xl:hidden border-b border-border/40 pb-4">
                <h2 className="text-[14px] font-black uppercase tracking-widest text-primary font-mono flex items-center gap-2">
                  <Database className="h-4 w-4" /> /SYS/DATA_LOG
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-[8px] bg-muted/50 border border-border hover:bg-muted text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 h-full overflow-y-auto xl:overflow-visible custom-scrollbar pb-24 xl:pb-0 pr-2 xl:pr-4">
                {snapshotsQuery.data ? (
                  <MetricSnapshotList 
                    snapshots={snapshotsQuery.data} 
                    projectId={projectId} 
                    onEdit={(snapshot) => {
                      setEditingSnapshot(snapshot);
                      setIsSidebarOpen(false); // Close sidebar on mobile
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
