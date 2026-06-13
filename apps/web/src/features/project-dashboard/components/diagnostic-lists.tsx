"use client";

import { AlertTriangle, CheckCircle2, Lightbulb, ChevronDown, ChevronUp, TerminalSquare } from "lucide-react";
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
  const iconColor = variant === "alert" ? "text-destructive" : variant === "strength" ? "text-emerald-500" : "text-amber-500";
  const bgColor = variant === "alert" ? "bg-destructive/10 border-destructive/30" : variant === "strength" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30";
  const textColor = variant === "alert" ? "text-destructive" : variant === "strength" ? "text-emerald-500" : "text-amber-500";

  return (
    <div className={cn(
      "rounded-[20px] border border-border/60 bg-card/40 backdrop-blur-xl overflow-hidden transition-all shadow-sm relative group",
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Colapsar" : "Expandir"} ${title}`}
        className="relative z-10 flex w-full items-center justify-between p-5 hover:bg-card/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-[12px] shadow-inner", bgColor)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
          <div className="text-left">
            <p className="text-sm font-black uppercase tracking-wider text-foreground">{title}</p>
            {items?.length ? (
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-widest">{items.length} LOG_ENTRIES</p>
            ) : (
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5 uppercase tracking-widest">LOG_EMPTY</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center h-8 w-8 rounded-[8px] bg-background/50 border border-border/40 text-muted-foreground group-hover:text-primary transition-colors">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Items */}
      {expanded && (
        <div className="relative z-10 px-5 pb-5 space-y-3">
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
                    "relative overflow-hidden rounded-[16px] border border-border/40 bg-background/50 p-4 transition-all hover:bg-card hover:shadow-md group/item",
                  )}
                >
                  <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover/item:opacity-100 transition-opacity", bgColor.split(" ")[0])} />
                  
                  <div className="flex items-start gap-4 pl-2">
                    <TerminalSquare className={cn("mt-0.5 h-4 w-4 shrink-0 opacity-70", textColor)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">{title_}</h3>
                        {priority && (
                          <span className="rounded-[4px] bg-muted px-1.5 py-0.5 text-[9px] font-mono font-bold text-muted-foreground uppercase">
                            PRIORITY:{priority}
                          </span>
                        )}
                        {severity && (
                          <span className={cn(
                            "rounded-[4px] px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase",
                            severity === "HIGH" ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-500"
                          )}>
                            SEV:{severity}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">{message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[16px] border border-dashed border-border/60 bg-background/30 px-4 py-8 text-center flex flex-col items-center gap-3">
              <TerminalSquare className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
                {variant === "alert" 
                  ? "SYS_OK: NO_ISSUES_DETECTED" 
                  : variant === "strength" 
                  ? "SYS_INFO: NO_STRENGTHS_FOUND" 
                  : "SYS_INFO: NO_RECOMMENDATIONS"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
