import Link from "next/link";
import { Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEnum } from "@/lib/utils";
import { MaybeNumber, ProjectDashboardResponse } from "@/types/api";

function toPercent(value: MaybeNumber) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
}

export function ProjectScoreCard({ projectId, score }: { projectId: string; score: ProjectDashboardResponse["latest_score"] }) {
  if (!score) {
    return (
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-muted p-3 text-primary"><Gauge className="h-6 w-6" /></span>
          <div>
            <h2 className="text-lg font-semibold">Sin diagnostico aun</h2>
            <p className="text-sm text-muted-foreground">Registra metricas y genera un score explicable.</p>
          </div>
        </div>
      </Card>
    );
  }

  const percent = toPercent(score.overall_score);
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(#173f35 ${percent * 3.6}deg, #ece7dc 0deg)` }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-card">
            <span className="text-3xl font-semibold">{score.overall_score}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Score heuristico</p>
          <h2 className="mt-1 text-2xl font-semibold">{formatEnum(score.sustainability_level)}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Recomendacion: {formatEnum(score.decision_recommendation)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary">{formatEnum(score.sustainability_level)}</Badge>
            <Badge>{formatEnum(score.decision_recommendation)}</Badge>
          </div>
          <Link href={`/projects/${projectId}/score`} className="mt-4 inline-flex text-sm font-semibold text-primary">
            Abrir diagnostico completo
          </Link>
        </div>
      </div>
    </Card>
  );
}
