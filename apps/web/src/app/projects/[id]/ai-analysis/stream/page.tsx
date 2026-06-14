"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Activity, CheckCircle2, KeyRound, LayoutDashboard } from "lucide-react";
import { useCompletion } from "@ai-sdk/react";
import { getAuthToken } from "@/lib/auth-token";
import { API_BASE_URL } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { ByokOnboardingModal } from "@/features/ai-keys/components/byok-onboarding-modal";
import { Streamdown } from "streamdown";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { analysisTypeLabel } from "@/features/ai-analyses/utils";
import { AiAnalysisType } from "@/features/ai-analyses/types";
import { Button } from "@/components/ui/button";

export default function AiAnalysisStreamPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id;
  
  const keyId = searchParams.get("keyId");
  const type = searchParams.get("type");
  const model = searchParams.get("model");
  const q = searchParams.get("q");

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  
  const { completion, complete, isLoading, error } = useCompletion({
    api: `${API_BASE_URL}/saas-projects/${projectId}/ai-analyses/stream`,
    streamProtocol: 'text',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  });

  const hasStartedRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showByokOnboarding, setShowByokOnboarding] = useState(false);

  // Detect 402 / credits exhausted
  const is402 = !!error && (
    error.message.includes("crédito") ||
    error.message.includes("credit") ||
    error.message.includes("402") ||
    error.message.includes("PAYMENT_REQUIRED") ||
    (error as Error & { status?: number }).status === 402
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hasStartedRef.current && keyId && type && !isLoading) {
      hasStartedRef.current = true;
      complete("", {
        body: {
          ai_key_id: keyId,
          analysis_type: type,
          model_name: model || undefined,
          custom_question: q || undefined,
        }
      });
    }
  }, [keyId, type, model, q, complete, isLoading]);

  useEffect(() => {
    if (isLoading) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [completion, isLoading]);

  const isFinished = !isLoading && completion.length > 0;

  useEffect(() => {
    if (isFinished) {
      // Invalidate to fetch the newly created analysis
      queryClient.invalidateQueries({ queryKey: ["ai-analyses", projectId] });
      // Redirect to the latest analysis (since it was just created)
      const redirectTimer = setTimeout(() => {
        router.replace(`/projects/${projectId}/ai-analysis`);
      }, 1500); // Pequeño delay para que el usuario vea el "Completado"
      return () => clearTimeout(redirectTimer);
    }
  }, [isFinished, projectId, queryClient, router]);

  if (!mounted) return null;

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Link href={`/projects/${projectId}/ai-analysis`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors bg-background/50 border border-border/40 px-3 py-1.5 rounded-[8px]">
            <ArrowLeft className="h-3 w-3" />
            Cancelar Stream
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
              NODE: {projectQuery.data?.name || "PROJECT"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-card shadow-sm border border-border/60">
          {isLoading ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Procesando</span>
            </>
          ) : isFinished ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-black tracking-widest uppercase text-emerald-500">Guardando...</span>
            </>
          ) : error ? (
            <>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              <span className="text-[10px] font-black tracking-widest uppercase text-destructive">Error</span>
            </>
          ) : (
            <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Preparando</span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse"></span>
                SYS_DIAGNOSTIC_LOG (STREAMING)
              </p>
              <h1 className="mt-3 font-display text-4xl font-black uppercase tracking-tight text-foreground">
                {type ? analysisTypeLabel(type as AiAnalysisType) : "Generando Análisis"}
              </h1>
              <p className="mt-3 text-[12px] font-mono leading-relaxed text-muted-foreground uppercase max-w-xl">
                &gt; Sintetizando respuesta del LLM en tiempo real...
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <span className="inline-flex items-center rounded-[8px] bg-background/50 border border-border/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {model || "DEFAULT_MODEL"}
              </span>
            </div>
          </div>
        </div>

        {error && !is402 && (
          <div className="p-6 rounded-[16px] bg-destructive/10 border border-destructive/30 text-destructive mb-8 animate-in fade-in">
            <h3 className="font-bold mb-2 uppercase text-xs tracking-widest">Error de sistema</h3>
            <p className="text-sm font-mono">{error.message}</p>
          </div>
        )}

        {is402 && (
          <div className="p-6 rounded-[16px] bg-card border border-border/60 shadow-sm mb-8 animate-in fade-in">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1 uppercase text-xs tracking-widest">Créditos agotados</h3>
                <p className="text-xs font-mono leading-relaxed text-muted-foreground mb-4 max-w-2xl">
                  &gt; Tus créditos del sistema se han agotado. Activa tu propia API key gratuita para continuar usando el análisis IA sin límites ni interrupciones.
                </p>
                <Button
                  onClick={() => setShowByokOnboarding(true)}
                  className="rounded-[12px] shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                >
                  Configurar BYOK
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="relative overflow-hidden rounded-[24px] border border-border/60 bg-card/40 backdrop-blur-xl p-6 shadow-sm min-h-[400px]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
          <div className="relative z-10 prose prose-neutral dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-p:leading-relaxed prose-p:font-medium prose-p:text-[13px] prose-li:leading-relaxed prose-li:text-[13px] prose-strong:text-accent">
            {completion ? (
              <>
                <Streamdown>{completion.replace(/```json[\s\S]*/i, "").replace(/\{\s*"problem_clarity_score"[\s\S]*/i, "")}</Streamdown>
                <div ref={endRef} className="h-8" />
              </>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4 animate-pulse">
                <Activity className="h-8 w-8 text-primary" />
                <p className="text-[10px] font-mono tracking-widest uppercase">Analizando historial del sistema...</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      <ByokOnboardingModal isOpen={showByokOnboarding} onClose={() => setShowByokOnboarding(false)} />
    </DashboardShell>
  );
}
