import { useQuery } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";

export interface WorkspaceDetail {
  _id: string;
  name: string;
  slug: string;
  owner: { _id: string; name: string; email: string };
  members: Array<{ name: string; email: string; role: string }>;
  channels: Array<{ type: string; active: boolean }>;
  created_at: string;
  plan: {
    tier: string;
    status: string;
    billing_cycle: string | null;
    trial_started_at: string | null;
    next_billing_date: string | null;
    suspended_at: string | null;
    suspension_reason: string | null;
    coupon_applied: string | null;
    override_by: string | null;
    override_note: string | null;
    usage: {
      conversations_this_month: number;
      agents: number;
      channels: number;
      knowledge_items: number;
      bots: number;
      storage_gb: number;
    };
    limits: {
      conversations_per_month: number;
      agents: number;
      channels: number;
      knowledge_items: number;
      bots: number;
      storage_gb: number;
    };
  };
  recent_invoices: Array<{
    _id: string;
    amount: number;
    status: string;
    period_start: string;
    period_end: string;
    tier: string;
    paid_at: string | null;
  }>;
}

export function useSuperAdminWorkspace(workspaceId: string) {
  return useQuery<WorkspaceDetail>({
    queryKey: ["superadmin", "workspaces", workspaceId],
    queryFn: async () => {
      const res = await apiSuperAdmin.get(`/superadmin/workspaces/${workspaceId}`);
      const d = res.data;

      // El backend no retorna "owner" como campo separado —
      // lo extraemos del array members buscando rol 'owner'
      type RawMember = { _id: string; user?: { _id: string; name: string; email: string; avatar_url?: string }; role: string; active: boolean };
      const rawMembers: RawMember[] = d.members ?? [];
      const ownerMember = rawMembers.find((m) => m.role === "owner");

      return {
        _id:      d._id,
        name:     d.name,
        slug:     d.slug,
        created_at: d.createdAt ?? d.created_at ?? "",
        owner: ownerMember?.user
          ? { _id: ownerMember.user._id, name: ownerMember.user.name, email: ownerMember.user.email }
          : { _id: "", name: "—", email: "—" },
        members: rawMembers.map((m) => ({
          name:  m.user?.name  ?? "—",
          email: m.user?.email ?? "—",
          role:  m.role,
        })),
        channels: (d.channels ?? []).map((c: { type: string; active: boolean }) => ({
          type:   c.type,
          active: c.active ?? true,
        })),
        plan: d.plan ? {
          ...d.plan,
          usage: {
            conversations_this_month: d.plan.usage?.conversations_this_month ?? 0,
            agents:          d.plan.usage?.agents          ?? 0,
            channels:        d.plan.usage?.channels        ?? 0,
            knowledge_items: d.plan.usage?.knowledge_items ?? 0,
            bots:            d.plan.usage?.bots            ?? 0,
            storage_gb:      d.plan.usage?.storage_gb      ?? 0,
          },
          limits: {
            conversations_per_month: d.plan.limits?.conversations_per_month ?? 100,
            agents:          d.plan.limits?.agents          ?? 2,
            channels:        d.plan.limits?.channels        ?? 1,
            knowledge_items: d.plan.limits?.knowledge_items ?? 50,
            bots:            d.plan.limits?.bots            ?? 0,
            storage_gb:      d.plan.limits?.storage_gb      ?? 1,
          },
        } : {
          tier: "free", status: "active", billing_cycle: null,
          trial_started_at: null, next_billing_date: null,
          suspended_at: null, suspension_reason: null,
          coupon_applied: null, override_by: null, override_note: null,
          usage:  { conversations_this_month: 0, agents: 0, channels: 0, knowledge_items: 0, bots: 0, storage_gb: 0 },
          limits: { conversations_per_month: 100, agents: 2, channels: 1, knowledge_items: 50, bots: 0, storage_gb: 1 },
        },
        recent_invoices: (d.recent_invoices ?? []).map((inv: {
          _id: string; amount: number; status: string;
          period_start: string; period_end: string; tier?: string; paid_at?: string;
        }) => ({
          _id:          inv._id,
          amount:       inv.amount,
          status:       inv.status,
          period_start: inv.period_start,
          period_end:   inv.period_end,
          tier:         inv.tier ?? "—",
          paid_at:      inv.paid_at ?? null,
        })),
      } satisfies WorkspaceDetail;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}
