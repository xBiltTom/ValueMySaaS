import { Card } from "@/components/ui/card";

export function LoadingState({ label = "Cargando..." }: { label?: string }) {
  return (
    <Card className="overflow-hidden p-6">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-36 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 rounded-2xl bg-muted p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-border" />
              <div className="h-8 w-16 animate-pulse rounded-lg bg-border" />
            </div>
          ))}
        </div>
        <div className="h-3 w-48 animate-pulse rounded-lg bg-muted" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
