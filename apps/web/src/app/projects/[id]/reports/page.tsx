"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Terminal } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { generateReport, listReports } from "@/features/reports/api";
import { ReportActions } from "@/features/reports/components/report-actions";
import { ReportList } from "@/features/reports/components/report-list";
import { cn } from "@/lib/utils";

export default function ProjectReportsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const queryClient = useQueryClient();

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const reportsQuery = useQuery({ queryKey: ["reports", projectId], queryFn: () => listReports(projectId) });

  const generateMutation = useMutation({
    mutationFn: () => generateReport(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
    },
  });

  return (
    <DashboardShell>
      {/* Back nav */}
      <div className="mb-6">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors bg-background/50 border border-border/40 px-3 py-1.5 rounded-[8px]"
        >
          <ArrowLeft className="h-3 w-3" />
          VOLVER AL DASHBOARD
        </Link>
      </div>

      {/* Page Header */}
      <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 md:p-8 mb-8 shadow-sm border-t-4 border-t-accent">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[12px] shadow-inner shrink-0 bg-accent/10 border border-accent/30">
            <Terminal className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-accent">
              <span className="h-2 w-2 rounded-full animate-pulse bg-accent"></span>
              GENERADOR DE REPORTES
            </p>
            <h1 className="mt-3 font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
              Análisis del Proyecto
            </h1>
            <p className="mt-2 text-[12px] md:text-[13px] font-mono text-muted-foreground uppercase leading-relaxed max-w-2xl">
              &gt; Compila métricas y diagnóstico de <span className="text-foreground font-bold">{projectQuery.data?.name || "tu proyecto"}</span> en un formato claro para su análisis.
            </p>
          </div>
        </div>
      </div>

      {projectQuery.isLoading || reportsQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError || reportsQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || reportsQuery.error)} />
      ) : null}
      {generateMutation.isError ? (
        <ErrorState
          title="Error de Generación"
          message={`${getApiErrorMessage(generateMutation.error)}. Verifica que el SaaS tenga métricas y diagnósticos registrados antes de intentar compilar un reporte.`}
        />
      ) : null}

      <div className="space-y-8">
        <ReportActions
          onGenerate={() => generateMutation.mutate()}
          isLoading={generateMutation.isPending}
        />
        {reportsQuery.data ? <ReportList projectId={projectId} reports={reportsQuery.data} /> : null}
      </div>
    </DashboardShell>
  );
}
