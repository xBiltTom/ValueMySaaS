"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BrainCircuit, LayoutDashboard } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { getAiAnalysis } from "@/features/ai-analyses/api";
import { AiAnalysisDetail } from "@/features/ai-analyses/components/ai-analysis-detail";
import { AiAnalysisModal } from "@/features/ai-analyses/components/ai-analysis-modal";

export default function AiAnalysisDetailPage() {
  const params = useParams<{ id: string; analysisId: string }>();
  const projectId = params.id;
  const analysisId = params.analysisId;
  const [showAiModal, setShowAiModal] = useState(false);

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const analysisQuery = useQuery({
    queryKey: ["ai-analysis", projectId, analysisId],
    queryFn: () => getAiAnalysis(projectId, analysisId),
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Link href={`/projects/${projectId}/ai-analysis`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" />
            Volver a análisis IA
          </Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {projectQuery.data?.name || "Proyecto"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <BrainCircuit className="h-4 w-4" />
            Generar otro análisis
          </button>
          <Link href={`/projects/${projectId}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-muted">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>

      {projectQuery.isLoading || analysisQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError || analysisQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || analysisQuery.error)} />
      ) : null}
      {analysisQuery.data ? <AiAnalysisDetail analysis={analysisQuery.data} /> : null}

      {projectQuery.data && (
        <AiAnalysisModal 
          isOpen={showAiModal} 
          onClose={() => setShowAiModal(false)} 
          projectId={projectQuery.data.id} 
          projectStage={projectQuery.data.stage} 
        />
      )}
    </DashboardShell>
  );
}
