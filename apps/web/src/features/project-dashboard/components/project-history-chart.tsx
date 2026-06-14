"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { formatDate } from "@/lib/formatters";
import { MaybeNumber } from "@/types/api";
import { cn } from "@/lib/utils";
import { TerminalSquare } from "lucide-react";

type Point = { date: string; label: string | null; value: MaybeNumber };

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[12px] border border-border/40 bg-card/95 backdrop-blur-md px-3 py-2 shadow-[0_5px_15px_rgba(0,0,0,0.1)]">
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">DATE: {label}</p>
      <p className="text-sm font-mono font-bold text-foreground">VAL: {payload[0].value ?? "NULL"}</p>
    </div>
  );
}

export function ProjectHistoryChart({
  title,
  data,
  color = "#4f46e5",
  isPlanning = false,
  className,
}: {
  title: string;
  data: Point[];
  color?: string;
  isPlanning?: boolean;
  className?: string;
}) {
  const chartData = data.map((item) => ({
    label: item.label || formatDate(item.date),
    value: item.value === null ? null : Number(item.value),
  }));

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[20px] border border-border/60 bg-card/40 backdrop-blur-md p-5 flex flex-col gap-4 shadow-sm group",
      className
    )}>
      {/* Background scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.02)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalSquare className="h-4 w-4 text-muted-foreground opacity-50" />
          <p className="text-[11px] font-black uppercase tracking-widest text-foreground">{title}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }}></span>
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }}></span>
          </span>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground hidden sm:block">DATA_STREAM</span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="relative z-10 flex-1 min-h-[192px] rounded-[12px] bg-background/30 p-2 border border-border/20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={9}
                tick={{ fill: "currentColor", opacity: 0.5, fontFamily: 'monospace' }}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={9} tick={{ fill: "currentColor", opacity: 0.5, fontFamily: 'monospace' }} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="step"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                fill={`url(#grad-${color.replace("#", "")})`}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="relative z-10 flex-1 min-h-[192px] flex flex-col items-center justify-center text-center rounded-[12px] border border-dashed border-border/40 bg-background/20">
          <TerminalSquare className="h-6 w-6 text-muted-foreground/30 mb-3" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Log_Empty</p>
          <p className="text-[9px] font-mono text-muted-foreground/60 mt-1 uppercase tracking-wider">Esperando secuencias de datos</p>
        </div>
      )}
    </div>
  );
}
