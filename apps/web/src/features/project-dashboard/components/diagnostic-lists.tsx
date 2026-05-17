import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function textFrom(item: Record<string, unknown>, key: string) {
  const value = item[key];
  return typeof value === "string" ? value : "";
}

export function DiagnosticList({
  title,
  items,
  variant = "recommendation",
}: {
  title: string;
  items?: Array<Record<string, unknown>> | null;
  variant?: "alert" | "strength" | "recommendation";
}) {
  const Icon = variant === "alert" ? AlertTriangle : variant === "strength" ? CheckCircle2 : Lightbulb;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items?.length ? (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-md border border-border bg-white p-4">
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{textFrom(item, "title") || textFrom(item, "code") || "Item"}</h3>
                    {textFrom(item, "priority") ? <Badge>{textFrom(item, "priority")}</Badge> : null}
                    {textFrom(item, "severity") ? <Badge className="text-destructive">{textFrom(item, "severity")}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {textFrom(item, "message") || JSON.stringify(item)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Sin elementos para mostrar.</p>
        )}
      </CardContent>
    </Card>
  );
}
