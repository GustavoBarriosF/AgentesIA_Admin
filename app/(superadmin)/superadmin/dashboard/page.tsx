"use client";

import {
  Building2,
  TrendingUp,
  Users,
  MessageSquare,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSuperAdminStats } from "@/lib/hooks/superadmin/useSuperAdminStats";

const TIER_COLORS: Record<string, string> = {
  free: "bg-zinc-500",
  starter: "bg-blue-500",
  pro: "bg-indigo-500",
  enterprise: "bg-purple-500",
};

function formatCurrency(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading, error } = useSuperAdminStats();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-red-400">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm">Error al cargar las métricas</span>
      </div>
    );
  }

  const totalTierCount =
    stats.workspaces_by_tier.free +
    stats.workspaces_by_tier.starter +
    stats.workspaces_by_tier.pro +
    stats.workspaces_by_tier.enterprise || 1;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500">Métricas globales de la plataforma</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          icon={<Building2 className="h-4 w-4" />}
          label="Workspaces activos"
          value={stats.active_workspaces.toString()}
          sub={`${stats.suspended_workspaces} suspendidos`}
          color="indigo"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="MRR"
          value={formatCurrency(stats.mrr)}
          sub={`ARR: ${formatCurrency(stats.arr)}`}
          color="green"
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Nuevos este mes"
          value={`+${stats.new_workspaces_this_month}`}
          sub={`${stats.churn_this_month} cancelaciones`}
          color="blue"
        />
        <KpiCard
          icon={<MessageSquare className="h-4 w-4" />}
          label="Conversaciones hoy"
          value={stats.total_conversations_today.toLocaleString()}
          sub={`${stats.total_messages_today.toLocaleString()} mensajes`}
          color="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Revenue chart */}
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-4 text-sm font-medium text-zinc-300">
            Ingresos últimos 12 meses
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.revenue_chart}>
              <XAxis
                dataKey="month"
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
              />
              <Tooltip
                formatter={(v: number) => [`$${(v / 100).toFixed(2)}`, "Revenue"]}
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 8,
                  color: "#f4f4f5",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier distribution */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="mb-4 text-sm font-medium text-zinc-300">
            Distribución por tier
          </p>
          <div className="space-y-3">
            {(
              ["free", "starter", "pro", "enterprise"] as const
            ).map((tier) => {
              const count = stats.workspaces_by_tier[tier];
              const pct = Math.round((count / totalTierCount) * 100);
              return (
                <div key={tier}>
                  <div className="mb-1 flex justify-between text-xs text-zinc-400">
                    <span className="capitalize">{tier}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${TIER_COLORS[tier]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top workspaces */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-4">
          <p className="text-sm font-medium text-zinc-300">
            Top workspaces por uso (conversaciones este mes)
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="px-5 py-3 text-left font-medium">#</th>
              <th className="px-5 py-3 text-left font-medium">Workspace</th>
              <th className="px-5 py-3 text-left font-medium">Tier</th>
              <th className="px-5 py-3 text-right font-medium">Conversaciones</th>
            </tr>
          </thead>
          <tbody>
            {stats.top_workspaces_by_usage.map((ws, i) => (
              <tr
                key={ws._id}
                className="border-b border-zinc-800/50 last:border-0"
              >
                <td className="px-5 py-3 text-zinc-500">{i + 1}</td>
                <td className="px-5 py-3">
                  <p className="font-medium text-zinc-200">{ws.name}</p>
                  <p className="text-xs text-zinc-500">{ws.slug}</p>
                </td>
                <td className="px-5 py-3">
                  <TierBadge tier={ws.tier} />
                </td>
                <td className="px-5 py-3 text-right text-zinc-300">
                  {ws.conversations_this_month.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-400/10",
    green: "text-emerald-400 bg-emerald-400/10",
    blue: "text-blue-400 bg-blue-400/10",
    violet: "text-violet-400 bg-violet-400/10",
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div
        className={`mb-3 inline-flex items-center justify-center rounded-lg p-2 ${colorMap[color]}`}
      >
        {icon}
      </div>
      <p className="text-2xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-1 text-xs text-zinc-600">{sub}</p>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    free: "bg-zinc-700 text-zinc-300",
    starter: "bg-blue-500/20 text-blue-400",
    pro: "bg-indigo-500/20 text-indigo-400",
    enterprise: "bg-purple-500/20 text-purple-400",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[tier] ?? "bg-zinc-700 text-zinc-300"}`}
    >
      {tier}
    </span>
  );
}
