"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaybeNumber } from "@/types/api";

type Point = { date: string; label: string | null; value: MaybeNumber };

export function ProjectHistoryChart({ title, data, color = "#173f35" }: { title: string; data: Point[]; color?: string }) {
  const chartData = data.map((item) => ({
    label: item.label || new Date(item.date).toLocaleDateString("es-PE", { month: "short", day: "2-digit" }),
    value: item.value === null ? null : Number(item.value),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Sin serie historica para esta metrica.</p>
        )}
      </CardContent>
    </Card>
  );
}
