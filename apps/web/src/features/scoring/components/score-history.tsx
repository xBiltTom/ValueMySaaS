import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatEnum } from "@/lib/utils";
import { SaasScoreListResponse } from "@/features/scoring/types";

export function ScoreHistory({ scores }: { scores: SaasScoreListResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scores.items.length ? (
          scores.items.map((score) => (
            <div key={score.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card p-4">
              <div>
                <p className="font-semibold">Score {score.overall_score}</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(score.created_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{formatEnum(score.sustainability_level)}</Badge>
                <Badge>{formatEnum(score.decision_recommendation)}</Badge>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No hay diagnósticos generados todavía.</p>
        )}
      </CardContent>
    </Card>
  );
}
