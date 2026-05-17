import { Card } from "@/components/ui/card";

export function LoadingState({ label = "Cargando datos reales..." }: { label?: string }) {
  return (
    <Card className="space-y-4 p-5">
      <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-md bg-muted" />
        <div className="h-24 animate-pulse rounded-md bg-muted" />
        <div className="h-24 animate-pulse rounded-md bg-muted" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}
