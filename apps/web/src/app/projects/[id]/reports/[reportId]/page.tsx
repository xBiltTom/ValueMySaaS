"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { getReport } from "@/features/reports/api";
import { ReportDetail } from "@/features/reports/components/report-detail";

export default function ReportDetailPage() {
  const params = useParams<{ id: string; reportId: string }>();
  const projectId = params.id;
  const reportId = params.reportId;

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const reportQuery = useQuery({
    queryKey: ["report", projectId, reportId],
    queryFn: () => getReport(projectId, reportId),
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Link href={`/projects/${projectId}/reports`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" />
            Volver a reportes
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {projectQuery.data?.name || "Proyecto"}
          </p>
        </div>
        <Link href={`/projects/${projectId}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold transition hover:bg-muted active:scale-95">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard del proyecto
        </Link>
      </div>

      {projectQuery.isLoading || reportQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError || reportQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || reportQuery.error)} />
      ) : null}
      {reportQuery.data ? <ReportDetail report={reportQuery.data} /> : null}
    </DashboardShell>
  );
}
