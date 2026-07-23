import { useQuery } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";

export interface SuperAdminStats {
  total_workspaces: number;
  active_workspaces: number;
  suspended_workspaces: number;
  workspaces_by_tier: {
    free: number;
    starter: number;
    pro: number;
    enterprise: number;
  };
  mrr: number;
  arr: number;
  new_workspaces_this_month: number;
  churn_this_month: number;
  total_conversations_today: number;
  total_messages_today: number;
  top_workspaces_by_usage: Array<{
    _id: string;
    name: string;
    slug: string;
    tier: string;
    conversations_this_month: number;
  }>;
  revenue_chart: Array<{ month: string; revenue: number }>;
}

export function useSuperAdminStats() {
  return useQuery<SuperAdminStats>({
    queryKey: ["superadmin", "stats"],
    queryFn: async () => {
      const res = await apiSuperAdmin.get("/superadmin/stats");
      const d = res.data;

      // El backend retorna estructura anidada — la aplanamos aquí
      return {
        total_workspaces:          d.workspaces?.total              ?? 0,
        active_workspaces:         d.workspaces?.active             ?? 0,
        suspended_workspaces:      d.workspaces?.suspended          ?? 0,
        workspaces_by_tier: {
          free:       d.workspaces?.by_tier?.free       ?? 0,
          starter:    d.workspaces?.by_tier?.starter    ?? 0,
          pro:        d.workspaces?.by_tier?.pro        ?? 0,
          enterprise: d.workspaces?.by_tier?.enterprise ?? 0,
        },
        mrr:                       d.revenue?.mrr                   ?? 0,
        arr:                       d.revenue?.arr                   ?? 0,
        new_workspaces_this_month: d.activity?.new_workspaces_month ?? 0,
        churn_this_month:          d.workspaces?.past_due           ?? 0,
        total_conversations_today: d.activity?.conversations_today  ?? 0,
        total_messages_today:      d.activity?.messages_today       ?? 0,
        top_workspaces_by_usage:  (d.top_workspaces ?? []).map(
          (w: { workspace_id: string; name: string; slug: string; tier: string; conversations_this_month: number }) => ({
            _id:                     w.workspace_id,
            name:                    w.name,
            slug:                    w.slug,
            tier:                    w.tier,
            conversations_this_month: w.conversations_this_month,
          })
        ),
        revenue_chart: d.revenue_chart ?? [],
      } satisfies SuperAdminStats;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
