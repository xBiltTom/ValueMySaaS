"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { formatDate } from "@/lib/formatters";
import { MaybeNumber } from "@/types/api";
import { cn } from "@/lib/utils";

type Point = { date: string; label: string | null; value: MaybeNumber };

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground">{payload[0].value ?? "—"}</p>
    </div>
  );
}

export function ProjectHistoryChart({
  title,
  data,
  color = "#4f46e5",
  isPlanning = false,
}: {
  title: string;
  data: Point[];
  color?: string;
  isPlanning?: boolean;
}) {
  const chartData = data.map((item) => ({
    label: item.label || formatDate(item.date),
    value: item.value === null ? null : Number(item.value),
  }));

  return (
    <div className={cn(
      "rounded-3xl border p-5 space-y-4",
      isPlanning
        ? "border-amber-200/60 bg-gradient-to-b from-amber-50/30 to-white"
        : "border-border bg-white"
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      </div>

      {chartData.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                tick={{ fill: "#a1a1aa" }}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={10} tick={{ fill: "#a1a1aa" }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                fill={`url(#grad-${color.replace("#", "")})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <div className="h-1 w-16 rounded-full bg-border mb-3" />
          <p className="text-xs text-muted-foreground">Sin datos históricos</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Registra métricas para ver la evolución</p>
        </div>
      )}
    </div>
  );
}
