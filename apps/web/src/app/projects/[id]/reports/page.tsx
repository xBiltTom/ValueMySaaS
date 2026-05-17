"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { generateBasicReport, generateExecutiveReport, listReports } from "@/features/reports/api";
import { ReportActions } from "@/features/reports/components/report-actions";
import { ReportList } from "@/features/reports/components/report-list";

export default function ProjectReportsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const queryClient = useQueryClient();

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const reportsQuery = useQuery({ queryKey: ["reports", projectId], queryFn: () => listReports(projectId) });

  const basicMutation = useMutation({
    mutationFn: () => generateBasicReport(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
    },
  });
  const executiveMutation = useMutation({
    mutationFn: () => generateExecutiveReport(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports", projectId] });
    },
  });

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Evidencia</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Reportes</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Convierte métricas y diagnóstico en evidencia para la toma de decisiones.
          {projectQuery.data ? ` Proyecto: ${projectQuery.data.name}.` : ""}
        </p>
      </div>

      {projectQuery.isLoading || reportsQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError || reportsQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || reportsQuery.error)} />
      ) : null}
      {basicMutation.isError || executiveMutation.isError ? (
        <ErrorState
          title="No se pudo generar el reporte"
          message={`${getApiErrorMessage(basicMutation.error || executiveMutation.error)}. Verifica que el SaaS tenga métricas registradas y un diagnóstico generado.`}
        />
      ) : null}

      <div className="space-y-6">
        <ReportActions
          onBasic={() => basicMutation.mutate()}
          onExecutive={() => executiveMutation.mutate()}
          isBasicLoading={basicMutation.isPending}
          isExecutiveLoading={executiveMutation.isPending}
        />
        {reportsQuery.data ? <ReportList projectId={projectId} reports={reportsQuery.data} /> : null}
      </div>
    </DashboardShell>
  );
}
