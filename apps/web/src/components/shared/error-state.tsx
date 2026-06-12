import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ErrorState({ title = "Algo salió mal", message }: { title?: string; message: string }) {
  return (
    <Card className="border-status-danger-border bg-status-danger-bg p-5">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-status-danger-fg/10">
          <AlertTriangle className="h-4 w-4 text-status-danger-fg" />
        </div>
        <div>
          <h2 className="font-semibold text-status-danger-text">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </div>
    </Card>
  );
}
