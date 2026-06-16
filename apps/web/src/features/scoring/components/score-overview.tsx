import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatEnum } from "@/lib/utils";
import { MaybeNumber } from "@/types/api";
import { SaasScore } from "@/features/scoring/types";

function percent(value: MaybeNumber) {
  const number = Number(value ?? 0);
  return Number.isNaN(number) ? 0 : Math.max(0, Math.min(100, number));
}

export function ScoreOverview({ score }: { score: SaasScore }) {
  const value = percent(score.overall_score);
  return (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
        <div
          className="grid h-40 w-40 place-items-center rounded-full mx-auto md:mx-0"
          style={{ background: `conic-gradient(var(--primary) ${value * 3.6}deg, var(--border) 0deg)` }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-card">
            <span className="text-4xl font-semibold">{score.overall_score}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Diagnóstico heurístico
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{formatEnum(score.sustainability_level)}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Recomendación de decisión: {formatEnum(score.decision_recommendation)}. Este score resume valor,
            sostenibilidad y riesgo con base en las métricas registradas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary">{formatEnum(score.sustainability_level)}</Badge>
            <Badge>{formatEnum(score.decision_recommendation)}</Badge>
            <Badge>Versión {score.scoring_version}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
