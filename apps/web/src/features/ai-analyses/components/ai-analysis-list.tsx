import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { providerLabel } from "@/features/ai-keys/utils";
import { AiAnalysisListResponse } from "@/features/ai-analyses/types";
import { analysisTypeLabel } from "@/features/ai-analyses/utils";

export function AiAnalysisList({ projectId, analyses }: { projectId: string; analyses: AiAnalysisListResponse }) {
  if (!analyses.items.length) {
    return (
      <EmptyState
        icon={BrainCircuit}
        title="Aun no hay analisis IA."
        description="Genera el primer diagnostico complementario usando una API Key BYOK activa."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analisis generados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analyses.items.map((analysis) => (
          <Link key={analysis.id} href={`/projects/${projectId}/ai-analysis/${analysis.id}`} className="block">
            <article className="rounded-md border border-border bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{analysisTypeLabel(analysis.analysis_type)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(analysis.created_at).toLocaleString("es-PE")}
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
