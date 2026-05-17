import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ErrorState({ title = "Algo salio mal", message }: { title?: string; message: string }) {
  return (
    <Card className="border-destructive/25 bg-white p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
        <div>
          <h2 className="font-semibold text-destructive">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </div>
    </Card>
  );
}
