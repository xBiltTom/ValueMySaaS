"use client";

import { AlertTriangle, CheckCircle2, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function textFrom(item: Record<string, unknown>, key: string) {
  const value = item[key];
  return typeof value === "string" ? value : "";
}

export function DiagnosticList({
  title,
  items,
  variant = "recommendation",
  isPlanning = false,
}: {
  title: string;
  items?: Array<Record<string, unknown>> | null;
  variant?: "alert" | "strength" | "recommendation";
  isPlanning?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const Icon = variant === "alert" ? AlertTriangle : variant === "strength" ? CheckCircle2 : Lightbulb;
  const iconColor = variant === "alert" ? "text-status-danger-fg" : variant === "strength" ? "text-status-success-fg" : "text-status-warning-fg";
  const bgColor = variant === "alert" ? "bg-status-danger-bg border-status-danger-border" : variant === "strength" ? "bg-status-success-bg border-status-success-border" : "bg-status-warning-bg border-status-warning-border";
  const headerColor = variant === "alert" ? "text-status-danger-text" : variant === "strength" ? "text-status-success-text" : "text-status-warning-text";

  return (
    <div className={cn(
      "rounded-3xl border overflow-hidden transition-all",
      isPlanning ? "border-amber-200/60" : "border-border"
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("rounded-xl p-2", bgColor)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">{title}</p>
            {items?.length ? (
              <p className="text-xs text-muted-foreground mt-0.5">{items.length} elemento{items.length !== 1 ? "s" : ""}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Sin elementos</p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Items */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {items?.length ? (
            items.map((item, index) => {
              const title_ = textFrom(item, "title") || textFrom(item, "code") || "Item";
              const message = textFrom(item, "message") || JSON.stringify(item);
              const priority = textFrom(item, "priority");
              const severity = textFrom(item, "severity");

              return (
                <div
                  key={`${title}-${index}`}
                  className={cn(
                    "rounded-2xl border p-4 transition-all hover:shadow-sm",
                    variant === "alert" ? "border-status-danger-border/60 bg-status-danger-bg/50" :
                    variant === "strength" ? "border-status-success-border/60 bg-status-success-bg/50" :
                    "border-status-warning-border/60 bg-status-warning-bg/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconColor)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-foreground">{title_}</h3>
                        {priority && (
                          <span className="rounded-full bg-card border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                            {priority}
                          </span>
                        )}
                        {severity && (
                          <span className="rounded-full bg-status-danger-bg border border-status-danger-border px-2 py-0.5 text-[10px] font-bold text-status-danger-text uppercase">
                            {severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">Sin elementos para mostrar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
