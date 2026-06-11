"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Activity, CheckCircle2, KeyRound, RotateCcw, LayoutDashboard } from "lucide-react";
import { useCompletion } from "@ai-sdk/react";
import { getAuthToken } from "@/lib/auth-token";
import { API_BASE_URL } from "@/lib/api-client";
import { getProject } from "@/features/project-dashboard/api";
import { ByokOnboardingModal } from "@/features/ai-keys/components/byok-onboarding-modal";
import { Streamdown } from "streamdown";

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
      queryClient.invalidateQueries({ queryKey: ["ai-analyses", projectId] });
    }
  }, [isFinished, projectId, queryClient]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background relative selection:bg-foreground selection:text-background font-sans">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-200/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-card/40 backdrop-blur-md border-b border-border/30">
        <Link 
          href={`/projects/${projectId}/ai-analysis`} 
          className="group flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black transition-colors"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/5 group-hover:bg-black/10 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Volver a Análisis
        </Link>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card shadow-sm border border-border">
          {isLoading ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </div>
              <span className="text-xs font-medium text-zinc-600 tracking-wide uppercase">Procesando</span>
            </>
          ) : isFinished ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-status-success-fg" />
              <span className="text-xs font-medium text-zinc-600 tracking-wide uppercase">Completado</span>
            </>
          ) : error ? (
            <>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-danger-fg"></span>
              <span className="text-xs font-medium text-zinc-600 tracking-wide uppercase">Error</span>
            </>
          ) : (
            <span className="text-xs font-medium text-zinc-600 tracking-wide uppercase">Preparando</span>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-40 px-6 max-w-4xl mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="mb-16 animate-in slide-in-from-bottom-4 fade-in duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-md bg-black text-white text-xs font-medium tracking-widest uppercase shadow-xl shadow-black/10">
            <Sparkles className="h-3 w-3" />
            Diagnóstico IA
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium tracking-tight text-zinc-900 leading-[1.1]">
            Análisis de viabilidad para <br />
            <span className="text-zinc-400 italic font-serif">{projectQuery.data?.name || "tu proyecto"}</span>
          </h1>
        </header>

        {/* Content Stream */}
        <div className="flex-1 relative">
          {error && !is402 && (
            <div className="p-6 rounded-2xl bg-status-danger-bg border border-status-danger-border text-status-danger-text mb-8 animate-in fade-in">
              <h3 className="font-semibold mb-2">Se interrumpió el análisis</h3>
              <p className="text-sm opacity-80">{error.message}</p>
            </div>
          )}

          {is402 && (
            <div className="p-6 rounded-2xl bg-card border border-border mb-8 animate-in fade-in">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Créditos agotados</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tus créditos del sistema se han agotado. Activa tu propia API key gratuita para continuar usando el análisis IA sin límites.
                  </p>
                  <button
                    onClick={() => setShowByokOnboarding(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <Sparkles className="h-4 w-4" />
                    Cómo obtener una API Key gratis
                  </button>
                </div>
              </div>
            </div>
          )}

          {completion ? (
            <div className="prose prose-zinc prose-lg md:prose-xl max-w-none prose-p:leading-relaxed prose-headings:font-display prose-headings:font-medium prose-headings:tracking-tight prose-a:text-indigo-600 prose-a:underline-offset-4 hover:prose-a:text-indigo-800 prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 prose-blockquote:bg-zinc-100/50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-zinc-600 prose-li:marker:text-zinc-400">
              <Streamdown>{completion.replace(/```json[\s\S]*/i, "").replace(/\{\s*"problem_clarity_score"[\s\S]*/i, "")}</Streamdown>
              <div ref={endRef} className="h-8" />
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-zinc-400 gap-6 animate-pulse">
              <Activity className="h-12 w-12 text-zinc-300" />
              <p className="text-lg font-medium tracking-tight">Interpretando métricas del sistema...</p>
            </div>
          ) : null}

          {/* Completion Actions */}
          {isFinished && (
            <div className="mt-20 pt-10 border-t border-black/10 flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300 fill-mode-both">
              <button
                onClick={() => router.push(`/projects/${projectId}/ai-analysis`)}
                className="group relative flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10"
              >
                <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-180 duration-500" />
                Generar otro análisis
              </button>
              
              <Link
                href={`/projects/${projectId}`}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-card px-8 py-4 text-sm font-medium text-foreground shadow-sm border border-border transition-colors hover:bg-muted"
              >
                <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                Volver al dashboard
              </Link>
            </div>
          )}
        </div>
      </main>

      <ByokOnboardingModal isOpen={showByokOnboarding} onClose={() => setShowByokOnboarding(false)} />
    </div>
  );
}
