import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/formatters";
import { providerLabel } from "@/features/ai-keys/utils";
import { AiAnalysisListResponse } from "@/features/ai-analyses/types";
import { analysisTypeLabel } from "@/features/ai-analyses/utils";

export function AiAnalysisList({ projectId, analyses }: { projectId: string; analyses: AiAnalysisListResponse }) {
  if (!analyses.items.length) {
    return (
      <EmptyState
        icon={BrainCircuit}
        title="Aún no hay análisis IA."
        description="Genera un análisis asistido usando una API Key activa y el contexto del SaaS."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis generados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analyses.items.map((analysis) => (
          <Link key={analysis.id} href={`/projects/${projectId}/ai-analysis/${analysis.id}`} className="block">
            <article className="rounded-md border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{analysisTypeLabel(analysis.analysis_type)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateTime(analysis.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary">{providerLabel(analysis.provider)}</Badge>
                  <Badge>{analysis.model_name || "Modelo por defecto"}</Badge>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
