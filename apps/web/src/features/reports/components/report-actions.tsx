"use client";

import { Presentation, Command } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportActions({
  onGenerate,
  isLoading,
}: {
  onGenerate: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-1 max-w-2xl">
      <button 
        onClick={onGenerate} 
        disabled={isLoading}
        className="group relative overflow-hidden rounded-[20px] border border-border/40 bg-card/40 backdrop-blur-md p-6 md:p-8 text-left transition-all hover:bg-card hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
        <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-primary/30 rounded-tr-[20px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-background border border-border/40 group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors shrink-0">
            <Presentation className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-black uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
              Generar Reporte Completo
            </h3>
            <p className="text-[12px] md:text-[13px] font-mono leading-relaxed text-muted-foreground">
              Obtén un análisis detallado sobre el estado actual de tu proyecto, con métricas clave, riesgos y recomendaciones claras para mejorar su viabilidad.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-6 md:mt-8 flex items-center justify-between border-t border-dashed border-border/40 pt-4">
          <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Command className="h-3 w-3" /> ANALIZAR PROYECTO
          </span>
          {isLoading && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
        </div>
      </button>
    </div>
  );
}
