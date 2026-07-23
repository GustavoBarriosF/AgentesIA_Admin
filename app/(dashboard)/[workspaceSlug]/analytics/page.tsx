"use client";

import { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Star,
  Zap,
  MessagesSquare,
  TrendingUp,
  BrainCircuit,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { startOfDay, subDays, endOfDay } from "date-fns";
import { useAnalyticsOverview, useTokenUsage } from "@/lib/hooks/useAnalytics";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { KpiCard } from "@/components/analytics/KpiCard";
import { ChannelChart } from "@/components/analytics/ChannelChart";
import { AgentTable } from "@/components/analytics/AgentTable";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsDateRange } from "@/types/analytics";

function fmtDuration(seconds: number) {
  if (!seconds || seconds < 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function fmtPct(value: number) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function KpiSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start gap-4">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsDateRange>({
    from: startOfDay(subDays(new Date(), 29)).toISOString(),
    to: endOfDay(new Date()).toISOString(),
  });

  const { data, isLoading, isError } = useAnalyticsOverview(range);
  const { data: tokenData, isLoading: tokenLoading } = useTokenUsage(range);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      <div className="flex-1 p-6 space-y-6">
        {isError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Error al cargar los datos de analytics.
          </div>
        )}

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => <KpiSkeleton key={i} />)
          ) : data ? (
            <>
              <KpiCard
                label="Total conversaciones"
                value={(data.total_conversations ?? 0).toLocaleString()}
                icon={MessageSquare}
                iconClassName="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                sub={`${data.by_status?.open ?? 0} abiertas · ${data.by_status?.resolved ?? 0} resueltas`}
              />
              <KpiCard
                label="Total mensajes"
                value={(data.total_messages ?? 0).toLocaleString()}
                icon={MessagesSquare}
                iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
              />
              <KpiCard
                label="Abandonadas"
                value={(data.by_status?.abandoned ?? 0).toLocaleString()}
                icon={TrendingUp}
                iconClassName="bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                sub={
                  data.total_conversations
                    ? fmtPct((data.by_status?.abandoned ?? 0) / data.total_conversations) + " del total"
                    : undefined
                }
              />
              <KpiCard
                label="Primera respuesta"
                value={fmtDuration(data.avg_first_response_time_s ?? 0)}
                icon={Clock}
                iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                sub="Tiempo promedio"
              />
              <KpiCard
                label="Resolución promedio"
                value={fmtDuration(data.avg_resolution_time_s ?? 0)}
                icon={CheckCircle2}
                iconClassName="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
              />
              <KpiCard
                label="CSAT promedio"
                value={(data.avg_csat_score ?? 0) > 0 ? (data.avg_csat_score).toFixed(2) : "—"}
                icon={Star}
                iconClassName="bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
                sub="Sobre 5 puntos"
              />
              <KpiCard
                label="Tasa de escalación bot"
                value={fmtPct(data.bot_escalation_rate ?? 0)}
                icon={Zap}
                iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
                sub="Conversaciones escaladas a agente"
              />
            </>
          ) : null}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Channel breakdown */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Conversaciones por canal</h2>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChannelChart data={data?.by_channel ?? []} />
            )}
          </div>

          {/* Status breakdown */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Estado de conversaciones</h2>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : data ? (
              <div className="flex flex-col gap-3 pt-2">
                {[
                  { label: "Abiertas", value: data.by_status?.open ?? 0, color: "bg-indigo-500" },
                  { label: "Resueltas", value: data.by_status?.resolved ?? 0, color: "bg-green-500" },
                  { label: "Abandonadas", value: data.by_status?.abandoned ?? 0, color: "bg-rose-500" },
                ].map(({ label, value, color }) => {
                  const pct = data.total_conversations
                    ? Math.round((value / data.total_conversations) * 100)
                    : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="tabular-nums font-medium">
                          {value} <span className="text-muted-foreground font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Agent performance */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Rendimiento por agente</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <AgentTable data={data?.by_agent ?? []} />
          )}
        </div>

        {/* Token usage */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Uso de tokens IA
          </h2>

          {/* KPI tokens */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {tokenLoading ? (
              Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
            ) : tokenData ? (
              <>
                <KpiCard
                  label="Total tokens"
                  value={(tokenData.total_tokens ?? 0).toLocaleString()}
                  icon={BrainCircuit}
                  iconClassName="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                  sub={`${(tokenData.conversations_with_ai ?? 0).toLocaleString()} conversaciones con IA`}
                />
                <KpiCard
                  label="Tokens de entrada"
                  value={(tokenData.total_input_tokens ?? 0).toLocaleString()}
                  icon={ArrowDownToLine}
                  iconClassName="bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400"
                  sub="Contexto enviado al modelo"
                />
                <KpiCard
                  label="Tokens de salida"
                  value={(tokenData.total_output_tokens ?? 0).toLocaleString()}
                  icon={ArrowUpFromLine}
                  iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                  sub="Respuestas generadas"
                />
                <KpiCard
                  label="Promedio por conversación"
                  value={(tokenData.avg_total_tokens_per_conv ?? 0).toLocaleString()}
                  icon={MessagesSquare}
                  iconClassName="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                  sub={`${(tokenData.avg_input_tokens_per_conv ?? 0).toLocaleString()} entrada · ${(tokenData.avg_output_tokens_per_conv ?? 0).toLocaleString()} salida`}
                />
              </>
            ) : null}
          </div>

          {/* Tabla por modelo */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Desglose por modelo</h2>
            {tokenLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : tokenData && tokenData.by_model.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="pb-2 pr-4 font-medium">Modelo</th>
                      <th className="pb-2 pr-4 font-medium text-right">Mensajes</th>
                      <th className="pb-2 pr-4 font-medium text-right">Entrada</th>
                      <th className="pb-2 pr-4 font-medium text-right">Salida</th>
                      <th className="pb-2 pr-4 font-medium text-right">Total</th>
                      <th className="pb-2 pr-4 font-medium text-right">Avg entrada/msg</th>
                      <th className="pb-2 font-medium text-right">Avg salida/msg</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tokenData.by_model.map((row) => (
                      <tr key={row.model} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 pr-4 font-mono text-xs text-foreground max-w-[200px] truncate">
                          {row.model}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {row.message_count.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-sky-600 dark:text-sky-400">
                          {row.input_tokens.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {row.output_tokens.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums font-medium">
                          {row.total_tokens.toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                          {row.avg_input_per_msg.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                          {row.avg_output_per_msg.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-medium">
                      <td className="pt-2.5 pr-4 text-muted-foreground">Total</td>
                      <td className="pt-2.5 pr-4 text-right tabular-nums">
                        {tokenData.by_model.reduce((s, r) => s + r.message_count, 0).toLocaleString()}
                      </td>
                      <td className="pt-2.5 pr-4 text-right tabular-nums text-sky-600 dark:text-sky-400">
                        {tokenData.total_input_tokens.toLocaleString()}
                      </td>
                      <td className="pt-2.5 pr-4 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {tokenData.total_output_tokens.toLocaleString()}
                      </td>
                      <td className="pt-2.5 pr-4 text-right tabular-nums">
                        {tokenData.total_tokens.toLocaleString()}
                      </td>
                      <td className="pt-2.5 pr-4" />
                      <td className="pt-2.5" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay datos de uso de tokens en este período.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
