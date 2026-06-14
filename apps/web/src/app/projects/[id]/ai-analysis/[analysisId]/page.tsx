"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BrainCircuit, LayoutDashboard, Activity } from "lucide-react";
import { useCompletion } from "@ai-sdk/react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage, API_BASE_URL } from "@/lib/api-client";
import { getAuthToken } from "@/lib/auth-token";
import { getProject } from "@/features/project-dashboard/api";
import { getAiAnalysis } from "@/features/ai-analyses/api";
import { AiAnalysisDetail } from "@/features/ai-analyses/components/ai-analysis-detail";
import { AiAnalysisModal } from "@/features/ai-analyses/components/ai-analysis-modal";
import { AiAnalysis, AiAnalysisType } from "@/features/ai-analyses/types";

export default function AiAnalysisDetailPage() {
  const params = useParams<{ id: string; analysisId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const projectId = params.id;
  const analysisId = params.analysisId;
  const [showAiModal, setShowAiModal] = useState(false);

  const isStreaming = searchParams.get("stream") === "true";
  const keyId = searchParams.get("keyId");
  const type = searchParams.get("type");
  const model = searchParams.get("model");
  const q = searchParams.get("q");

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  
  const analysisQuery = useQuery({
    queryKey: ["ai-analysis", projectId, analysisId],
    queryFn: () => getAiAnalysis(projectId, analysisId),
    enabled: !isStreaming,
  });

  const { completion, complete, isLoading, error: streamError } = useCompletion({
    api: `${API_BASE_URL}/saas-projects/${projectId}/ai-analyses/stream`,
    streamProtocol: 'text',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  });

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isStreaming && !hasStartedRef.current && keyId && type && !isLoading) {
      hasStartedRef.current = true;
      complete("", {
        body: {
          ai_key_id: keyId,
          analysis_type: type,
          model_name: model || undefined,
          custom_question: q || undefined,
          analysis_id: analysisId,
        }
      });
    }
  }, [isStreaming, keyId, type, model, q, analysisId, complete, isLoading]);

  const isFinished = isStreaming && !isLoading && completion.length > 0;

  useEffect(() => {
    if (isFinished) {
      queryClient.invalidateQueries({ queryKey: ["ai-analyses", projectId] });
      queryClient.invalidateQueries({ queryKey: ["ai-analysis", projectId, analysisId] });
      
      const timer = setTimeout(() => {
        router.replace(`/projects/${projectId}/ai-analysis/${analysisId}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFinished, projectId, analysisId, queryClient, router]);

  // Si estamos en stream y no tenemos los datos finales, simulamos un objeto análisis para que la tarjeta no cambie de forma
  const displayAnalysis: AiAnalysis | undefined = isStreaming 
    ? {
        id: analysisId,
        saas_project_id: projectId,
        metric_snapshot_id: null,
        score_id: null,
        user_id: "",
        provider: "OPENAI", // Fallback visual
        model_name: model || "Generando...",
        analysis_type: (type as AiAnalysisType) || "FULL_DIAGNOSIS",
        prompt_version: "v1",
        input_context: null,
        output_text: completion || "...", // Stream text!
        output_json: null,
        tokens_input: null,
        tokens_output: null,
        estimated_cost: null,
        created_at: new Date().toISOString(),
      } 
    : analysisQuery.data;

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
            disabled={isStreaming}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-accent px-6 text-[11px] font-black uppercase tracking-widest text-accent-foreground shadow-[0_0_20px_rgba(var(--accent),0.2)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? <Activity className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            {isLoading ? "Generando..." : "Ejecutar de nuevo"}
          </button>
          <Link href={`/projects/${projectId}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-border/60 bg-card/50 backdrop-blur-md px-6 text-[11px] font-black uppercase tracking-widest transition-all hover:bg-card hover:scale-[1.02] active:scale-95">
            <LayoutDashboard aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* Loading state del proyecto o si la data final está cargando */}
      {(projectQuery.isLoading || (analysisQuery.isLoading && !isStreaming)) && (
        <div className="mt-12">
          <LoadingState />
        </div>
      )}
      
      {/* Errores */}
      {projectQuery.isError || (analysisQuery.isError && !isStreaming) ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || analysisQuery.error)} />
      ) : null}
      
      {streamError && isStreaming ? (
        <ErrorState message={streamError.message} />
      ) : null}

      {/* Renderizado de Análisis */}
      {isStreaming && isLoading && completion.length === 0 ? (
        <div className="mt-12">
          <LoadingState label="GENERANDO ANÁLISIS..." />
        </div>
      ) : displayAnalysis ? (
        <div className="animate-in fade-in duration-500">
          <AiAnalysisDetail analysis={displayAnalysis} isStreaming={isStreaming && isLoading} />
        </div>
      ) : null}

      {projectQuery.data && (
        <AiAnalysisModal 
          isOpen={showAiModal} 
          onClose={() => setShowAiModal(false)} 
          projectId={projectQuery.data.id} 
          projectStage={projectQuery.data.stage} 
          latestSnapshotId={undefined}
        />
      )}
    </DashboardShell>
  );
}
