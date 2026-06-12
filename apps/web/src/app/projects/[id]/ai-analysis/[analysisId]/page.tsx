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
      <div className="mb-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Link href={`/projects/${projectId}/ai-analysis`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors bg-background/50 border border-border/40 px-3 py-1.5 rounded-[8px]">
            <ArrowLeft className="h-3 w-3" />
            Volver a análisis
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              NODE: {projectQuery.data?.name || "PROJECT"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => setShowAiModal(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-accent px-6 text-[11px] font-black uppercase tracking-widest text-accent-foreground shadow-[0_0_20px_rgba(var(--accent),0.2)] transition-all hover:scale-[1.02] active:scale-95"
          >
            <BrainCircuit aria-hidden="true" className="h-4 w-4" />
            Ejecutar de nuevo
          </button>
          <Link href={`/projects/${projectId}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-border/60 bg-card/50 backdrop-blur-md px-6 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-card hover:scale-[1.02] active:scale-95">
            <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
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
