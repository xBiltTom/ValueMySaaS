"use client";

import { useEffect, useState } from "react";
import { Loader2, Terminal, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "PROCESANDO...", className }: { label?: string; className?: string }) {
  const [dots, setDots] = useState("");
  const [activeBlocks, setActiveBlocks] = useState<number[]>([]);

  // Simple dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Random active blocks for the progress bar
  useEffect(() => {
    const interval = setInterval(() => {
      const newBlocks = [];
      for (let i = 0; i < 12; i++) {
        if (Math.random() > 0.6) newBlocks.push(i);
      }
      setActiveBlocks(newBlocks);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("w-full flex items-center justify-center p-4 md:p-8 min-h-[300px]", className)}>
      <div className="relative w-full max-w-md group">
        {/* Glow effect behind the box */}
        <div className="absolute -inset-1 bg-primary/20 blur-xl rounded-lg animate-pulse" />
        
        <div className="relative border-2 border-border/60 bg-card shadow-[6px_6px_0_rgba(0,0,0,0.2)] md:shadow-[8px_8px_0_rgba(0,0,0,0.2)] rounded-lg overflow-hidden transition-all group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[10px_10px_0_rgba(var(--primary),0.2)] group-hover:border-primary/50">
          
          {/* Terminal Header */}
          <div className="border-b-2 border-border/60 bg-muted/30 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-foreground">
                /SYS/PRC/AWAIT_DATA
              </span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 border border-border/80 bg-background" />
              <div className="w-2.5 h-2.5 border border-border/80 bg-background" />
              <div className="w-2.5 h-2.5 bg-primary animate-pulse" />
            </div>
          </div>

          {/* Main Body */}
          <div className="p-6 md:p-8 flex flex-col items-center justify-center relative min-h-[220px]">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
            
            {/* Central Spinner Visual */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-[spin_4s_linear_infinite]" />
              <div className="absolute -inset-2 rounded-full border border-dotted border-primary/50 animate-[spin_3s_linear_infinite_reverse]" />
              <div className="h-16 w-16 bg-primary/5 border border-primary/20 flex items-center justify-center rounded-full relative z-10 backdrop-blur-sm">
                <Cpu className="w-6 h-6 text-primary absolute opacity-20" />
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            </div>

            {/* Text & Progress */}
            <div className="text-center z-10 w-full">
              <h3 className="text-base md:text-lg font-black font-display tracking-widest text-foreground uppercase mb-4 flex items-center justify-center gap-1">
                {label}
                <span className="inline-block w-6 text-left text-primary">{dots}</span>
              </h3>
              
              {/* Brutalist Progress Bar */}
              <div className="w-full flex justify-center gap-1.5 mt-2">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "h-3 w-4 border border-primary/30 transition-colors duration-75",
                      activeBlocks.includes(i) ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" : "bg-primary/5"
                    )}
                  />
                ))}
              </div>
              
              <div className="mt-6 flex flex-col items-center gap-1">
                <p className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  ESTABLECIENDO CONEXIÓN AL NÚCLEO
                </p>
                <p className="text-[9px] font-mono text-muted-foreground/60 uppercase">
                  ESPERANDO RESPUESTA DEL SERVIDOR...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
