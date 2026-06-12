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
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link
            href={`/projects/${projectId}/reports`}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors bg-background/50 border border-border/40 px-3 py-1.5 rounded-[8px]"
          >
            <ArrowLeft className="h-3 w-3" />
            VOLVER_A_REPORTES
          </Link>
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-l-2 border-primary/50 pl-2">
            SYS_PROJ: {projectQuery.data?.name || "UNKNOWN"}
          </p>
        </div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-border/60 bg-card/40 backdrop-blur-sm px-4 text-[10px] font-black uppercase tracking-widest transition hover:bg-card hover:border-primary/40 active:scale-95 shadow-sm"
        >
          <LayoutDashboard className="h-3 w-3 text-primary" />
          GO_TO_DASHBOARD
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
