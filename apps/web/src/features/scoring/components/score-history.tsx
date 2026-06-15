"use client";

import { useState } from "react";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { formatDateTime, formatEnum } from "@/lib/utils";
import { SaasScoreListResponse } from "@/features/scoring/types";
import { cn } from "@/lib/utils";

export function ScoreHistory({ scores }: { scores: SaasScoreListResponse }) {
  const [expanded, setExpanded] = useState(false);
  const displayScores = expanded ? scores.items : scores.items.slice(0, 2);
  const hasMore = scores.items.length > 2;

  return (
    <div className="rounded-[20px] border-2 border-border/60 bg-card/40 backdrop-blur-xl overflow-hidden relative">
      {/* Texture */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.015)_3px,rgba(0,0,0,0.015)_4px)] pointer-events-none" />
      
      <div className="relative z-10 p-6 border-b-2 border-border/30 bg-muted/20">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Historial de Diagnósticos
        </h3>
      </div>

      <div className="relative z-10 p-6 space-y-4">
        {scores.items.length ? (
          displayScores.map((score, idx) => (
            <div 
              key={score.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] border-2 border-border/40 bg-background/50 p-4 transition-colors hover:border-primary/40 hover:bg-card"
            >
              <div>
                <p className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest mb-1">
                  LOG_IDX_{idx.toString().padStart(2, "0")}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black font-display text-primary">
                    {score.overall_score}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground uppercase">
                    {formatDateTime(score.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-[6px] border-2 border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-primary font-mono">
                  {formatEnum(score.sustainability_level)}
                </span>
                <span className="inline-flex items-center rounded-[6px] border-2 border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-500 font-mono">
                  {formatEnum(score.decision_recommendation)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[16px] border-2 border-dashed border-border/40 bg-background/30 p-8 text-center">
            <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">
              SYS_INFO: NO_HISTORY_AVAILABLE
            </p>
          </div>
        )}

        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 rounded-[12px] border-2 border-border/40 bg-muted/20 py-3 text-[10px] font-black uppercase tracking-widest text-foreground transition-colors hover:bg-muted/40 hover:border-border/60"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" /> Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" /> Ver {scores.items.length - 2} anteriores
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
