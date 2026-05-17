import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { providerLabel } from "@/features/ai-keys/utils";
import { AiAnalysis } from "@/features/ai-analyses/types";
import { analysisTypeLabel } from "@/features/ai-analyses/utils";
import { AiAnalysisResult } from "@/features/ai-analyses/components/ai-analysis-result";

export function AiAnalysisDetail({ analysis }: { analysis: AiAnalysis }) {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Analisis asistido
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold">{analysisTypeLabel(analysis.analysis_type)}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Generado el {new Date(analysis.created_at).toLocaleString("es-PE")} como diagnostico complementario
              basado en datos registrados del SaaS.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary">{providerLabel(analysis.provider)}</Badge>
            <Badge>{analysis.model_name || "Modelo por defecto"}</Badge>
            <Badge>Prompt {analysis.prompt_version}</Badge>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Tokens entrada</p>
          <p className="mt-2 text-2xl font-semibold">{analysis.tokens_input ?? "N/A"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Tokens salida</p>
          <p className="mt-2 text-2xl font-semibold">{analysis.tokens_output ?? "N/A"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Costo estimado</p>
          <p className="mt-2 text-2xl font-semibold">{analysis.estimated_cost ?? "N/A"}</p>
        </Card>
      </div>
      <AiAnalysisResult analysis={analysis} />
    </div>
  );
}
