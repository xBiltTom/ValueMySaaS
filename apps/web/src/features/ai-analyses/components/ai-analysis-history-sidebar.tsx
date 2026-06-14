"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Clock, BrainCircuit, Activity, ChevronRight, Zap, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import { listAiAnalyses, deleteAiAnalysis } from "@/features/ai-analyses/api";
import { toast } from "@/lib/toast";
import { analysisTypeLabel } from "@/features/ai-analyses/utils";
import { providerLabel } from "@/features/ai-keys/utils";
import { cn } from "@/lib/utils";

export function AiAnalysisHistorySidebar({ 
  isOpen, 
  onClose,
  currentAnalysisId,
}: { 
  isOpen: boolean; 
  onClose: () => void;
  currentAnalysisId?: string;
}) {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const analysesQuery = useQuery({
    queryKey: ["ai-analyses", projectId],
    queryFn: () => listAiAnalyses(projectId),
    enabled: isOpen,
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (analysisId: string) => deleteAiAnalysis(projectId, analysisId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-analyses", projectId] });
      toast({ title: "Análisis eliminado", variant: "success" });
    },
    onError: () => {
      toast({ title: "Error al eliminar el análisis", variant: "destructive" });
    }
  });

  const analyses = analysesQuery.data?.items ?? [];

  // Handle escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="fixed inset-y-0 right-0 z-[110] w-full max-w-md border-l-2 border-border/60 bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 sm:max-w-md">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-border/40 p-6 bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-accent/20 border border-accent/30 text-accent">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                HISTORIAL IA
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground uppercase">
                {analyses.length} DIAGNÓSTICOS ENCONTRADOS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[6px] border border-border/40 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4">
          {analysesQuery.isLoading ? (
            <div className="flex justify-center p-8">
              <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-border/40 rounded-[16px]">
              <p className="text-xs font-mono text-muted-foreground uppercase">
                NO HAY DIAGNÓSTICOS AÚN
              </p>
            </div>
          ) : (
            analyses.map((analysis) => {
              const isCurrent = analysis.id === currentAnalysisId;
              
              return (
                <Link
                  key={analysis.id}
                  href={`/projects/${projectId}/ai-analysis/${analysis.id}`}
                  onClick={onClose}
                  className={cn(
                    "group block relative overflow-hidden rounded-[16px] border-2 transition-all duration-300 p-5",
                    isCurrent 
                      ? "border-accent bg-accent/5 shadow-[0_0_15px_rgba(var(--accent),0.1)]"
                      : "border-border/40 bg-card/40 hover:border-primary/40 hover:bg-card hover:-translate-y-1 hover:shadow-lg"
                  )}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isCurrent ? "bg-accent" : "bg-primary")} />
                          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                            {analysisTypeLabel(analysis.analysis_type)}
                          </h3>
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">
                          {formatDateTime(analysis.created_at)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirmId(analysis.id);
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-status-destructive-bg hover:text-status-destructive-fg"
                          title="Eliminar análisis"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted transition-transform group-hover:translate-x-1">
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center rounded-[6px] bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                        {providerLabel(analysis.provider)}
                      </span>
                      <span className="inline-flex items-center rounded-[6px] bg-muted/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground border border-border/40">
                        {analysis.model_name?.split('/').pop() || "LLM"}
                      </span>
                      {analysis.planning_output?.overall_score && (
                        <span className="inline-flex items-center gap-1 rounded-[6px] bg-status-success-bg/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-status-success-fg border border-status-success-fg/30">
                          <Zap className="h-2.5 w-2.5" />
                          SCORE: {analysis.planning_output.overall_score}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal (Retro-Futuristic) */}
      {deleteConfirmId && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-background/40 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div 
            className="relative w-full max-w-sm overflow-hidden rounded-[0px] border-4 border-red-500 bg-background p-6 shadow-[16px_16px_0_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning header strip */}
            <div className="absolute top-0 left-0 flex h-4 w-full items-center bg-red-500 px-2 overflow-hidden">
              <span className="text-[9px] font-mono font-black uppercase text-white tracking-widest whitespace-nowrap animate-pulse">
                // CRITICAL_WARNING // PURGE_DATA_PROTOCOL_INITIATED // CRITICAL_WARNING //
              </span>
            </div>
            
            <div className="mt-4 flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-red-500/10 border-2 border-red-500">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">SYS_WARN: Purga de Datos</h3>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Proceso irreversible</p>
              </div>
            </div>
            
            <p className="mb-6 text-xs text-muted-foreground leading-relaxed font-mono">
              ¿Confirmas la eliminación permanente de este diagnóstico IA? Esta acción destruirá los registros del análisis y no podrá deshacerse.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-none border-2 border-border/50 bg-background px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
                disabled={deleteMutation.isPending}
              >
                ABORTAR
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteConfirmId, {
                    onSuccess: () => setDeleteConfirmId(null)
                  });
                }}
                className="flex-1 rounded-none border-2 border-red-500 bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? <Activity className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                PURGAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
