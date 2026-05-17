"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { listAiKeys } from "@/features/ai-keys/api";
import { getProject } from "@/features/project-dashboard/api";
import { listAiAnalyses } from "@/features/ai-analyses/api";
import { AiAnalysisForm } from "@/features/ai-analyses/components/ai-analysis-form";
import { AiAnalysisList } from "@/features/ai-analyses/components/ai-analysis-list";
import { NoActiveAiKeyState } from "@/features/ai-analyses/components/no-active-ai-key-state";

export default function ProjectAiAnalysisPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const projectQuery = useQuery({ queryKey: ["project", projectId], queryFn: () => getProject(projectId) });
  const keysQuery = useQuery({ queryKey: ["ai-keys"], queryFn: listAiKeys });
  const analysesQuery = useQuery({
    queryKey: ["ai-analyses", projectId],
    queryFn: () => listAiAnalyses(projectId),
  });
  const activeKeys = keysQuery.data?.items.filter((key) => key.is_active) ?? [];

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">BYOK IA</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">Análisis IA</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Genera diagnósticos asistidos usando tus propias API Keys BYOK y los datos reales del SaaS.
          {projectQuery.data ? ` Proyecto: ${projectQuery.data.name}.` : ""}
        </p>
      </div>

      {projectQuery.isLoading || keysQuery.isLoading || analysesQuery.isLoading ? <LoadingState /> : null}
      {projectQuery.isError || keysQuery.isError || analysesQuery.isError ? (
        <ErrorState message={getApiErrorMessage(projectQuery.error || keysQuery.error || analysesQuery.error)} />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <BrainCircuit className="h-6 w-6 text-primary" />
              <CardTitle>Diagnóstico complementario</CardTitle>
              <CardDescription>
                La IA interpreta contexto registrado: proyecto, métricas, score, alertas y reportes disponibles.
                No reemplaza el diagnóstico heurístico; lo complementa para mejora continua.
              </CardDescription>
            </CardHeader>
          </Card>
          {keysQuery.data && activeKeys.length ? (
            <AiAnalysisForm projectId={projectId} activeKeys={activeKeys} />
          ) : null}
          {keysQuery.data && !activeKeys.length ? (
            <NoActiveAiKeyState hasKeys={keysQuery.data.items.length > 0} />
          ) : null}
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Historial de análisis</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Resultados generados por el backend usando tus claves BYOK activas.
            </p>
          </div>
          {analysesQuery.data ? <AiAnalysisList projectId={projectId} analyses={analysesQuery.data} /> : null}
        </div>
      </div>
    </DashboardShell>
  );
}
