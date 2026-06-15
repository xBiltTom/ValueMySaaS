"use client";

import { useCurrentUser } from "@/features/auth/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getPublicConfig } from "@/features/admin/api";
import { Terminal, Zap, ZapOff, BatteryWarning } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreditIndicator({ className }: { className?: string }) {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: config, isLoading: configLoading } = useQuery({ 
    queryKey: ["public-config"], 
    queryFn: getPublicConfig 
  });

  if (userLoading || configLoading) {
    return (
      <div className={cn("h-8 w-32 border-2 border-border/50 bg-muted/20 animate-pulse rounded-none", className)} />
    );
  }

  const credits = currentUser?.ai_credits ?? 0;
  const enabled = config?.system_credits_enabled ?? true;

  // Visual state determination
  let state: "high" | "low" | "empty" | "offline" = "high";
  if (!enabled) state = "offline";
  else if (credits === 0) state = "empty";
  else if (credits <= 5) state = "low";

  // Blocks for visual meter (max 5 blocks)
  const totalBlocks = 5;
  const activeBlocks = Math.min(Math.ceil((credits / 20) * 5), 5); // 20 credits = full bar

  return (
    <div 
      className={cn(
        "group relative flex items-center gap-2 border-2 px-2.5 py-1 rounded-none font-mono text-[10px] uppercase tracking-widest font-black transition-all duration-300",
        state === "offline" && "border-muted-foreground/50 bg-muted/10 text-muted-foreground/70",
        state === "empty" && "border-destructive/60 bg-destructive/10 text-destructive shadow-[2px_2px_0_rgba(var(--destructive),0.3)]",
        state === "low" && "border-amber-500/60 bg-amber-500/10 text-amber-500 shadow-[2px_2px_0_rgba(245,158,11,0.3)]",
        state === "high" && "border-emerald-500/60 bg-emerald-500/10 text-emerald-500 shadow-[2px_2px_0_rgba(16,185,129,0.3)] hover:shadow-[4px_4px_0_rgba(16,185,129,0.4)] hover:-translate-y-0.5 hover:-translate-x-0.5",
        className
      )}
      title={!enabled ? "Sistema de créditos desactivado por el administrador" : `Tienes ${credits} créditos del sistema restantes`}
    >
      {/* Decorative corner cut (CSS trick with borders or absolute div) */}
      <div className={cn(
        "absolute -top-0.5 -right-0.5 w-2 h-2 border-t-2 border-r-2",
        state === "offline" && "border-muted-foreground",
        state === "empty" && "border-destructive",
        state === "low" && "border-amber-500",
        state === "high" && "border-emerald-500",
      )} />

      <div className="flex items-center gap-1.5 z-10">
        {state === "offline" ? (
          <ZapOff className="h-3.5 w-3.5" />
        ) : state === "empty" ? (
          <BatteryWarning className="h-3.5 w-3.5 animate-pulse" />
        ) : state === "low" ? (
          <Zap className="h-3.5 w-3.5 animate-pulse" />
        ) : (
          <Terminal className="h-3.5 w-3.5 group-hover:animate-pulse" />
        )}
        
        <span className="opacity-80">
          SYS.CRD:
        </span>
        <span className="text-xs">
          {state === "offline" ? "OFF" : credits.toString().padStart(3, "0")}
        </span>
      </div>

      {/* Visual Block Meter */}
      {state !== "offline" && (
        <div className="hidden sm:flex gap-[2px] ml-1">
          {Array.from({ length: totalBlocks }).map((_, i) => (
            <div 
              key={i}
              className={cn(
                "h-2.5 w-1.5 transition-all duration-500",
                i < activeBlocks 
                  ? (state === "high" ? "bg-emerald-500" : state === "low" ? "bg-amber-500" : "bg-destructive") 
                  : "bg-foreground/10"
              )}
              style={{
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      )}

      {/* Glitch effect overlay on hover */}
      {state === "high" && (
        <div className="absolute inset-0 bg-emerald-500/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
}
