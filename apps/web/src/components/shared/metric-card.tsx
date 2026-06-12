import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}
