import type { AnalyticsOverview } from "@/types/analytics";

function fmtDuration(seconds: number) {
  if (!seconds || seconds < 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function CsatDots({ score }: { score: number }) {
  const filled = Math.round((score / 5) * 5);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < filled ? "bg-green-500" : "bg-muted"}`}
        />
      ))}
      <span className="ml-1 text-xs tabular-nums text-muted-foreground">
        {score > 0 ? score.toFixed(1) : "—"}
      </span>
    </div>
  );
}

interface AgentTableProps {
  data: AnalyticsOverview["by_agent"];
}

export function AgentTable({ data }: AgentTableProps) {
  if (!data?.length) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
        Sin datos para este período
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.conversations - a.conversations);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium text-muted-foreground">Agente</th>
            <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Conversaciones</th>
            <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Resolución promedio</th>
            <th className="pb-2 font-medium text-muted-foreground">CSAT</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((agent) => (
            <tr key={agent.agent_id} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2.5 pr-4 font-medium">{agent.agent_name}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums">{agent.conversations}</td>
              <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                {fmtDuration(agent.avg_resolution_s)}
              </td>
              <td className="py-2.5">
                <CsatDots score={agent.csat_avg} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
