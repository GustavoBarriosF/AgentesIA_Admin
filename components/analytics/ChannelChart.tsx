"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { AnalyticsOverview } from "@/types/analytics";

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "#25d366",
  web: "#6366f1",
  email: "#f59e0b",
  instagram: "#e1306c",
  telegram: "#2ca5e0",
};

function getColor(type: string) {
  return CHANNEL_COLORS[type.toLowerCase()] ?? "#94a3b8";
}

interface ChannelChartProps {
  data: AnalyticsOverview["by_channel"];
}

export function ChannelChart({ data }: ChannelChartProps) {
  if (!data?.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Sin datos para este período
      </div>
    );
  }

  const chartData = data.map((ch) => ({
    name: ch.channel_name,
    value: ch.count,
    type: ch.type,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
          }}
          cursor={{ fill: "hsl(var(--muted))" }}
          formatter={(value: number) => [value, "Conversaciones"]}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.type)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
