import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspacePlan {
  _id: string;
  workspace_id: string;
  tier: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled" | "suspended";
  billing_cycle: "monthly" | "yearly" | null;
  stripe_cus_id: string | null;
  stripe_sub_id: string | null;
  trial_ends_at: string | null;
  trial_started_at: string | null;
  next_billing_date: string | null;
  coupon_applied: string | null;
  limits: {
    conversations_per_month: number;
    agents: number;
    channels: number;
    storage_gb: number;
    knowledge_items: number;
    bots: number;
  };
  usage: {
    conversations_this_month: number;
    agents: number;
    channels: number;
    knowledge_items: number;
    bots: number;
    storage_gb: number;
    period_start: string;
  };
}

export interface WorkspaceInvoice {
  _id: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  tier: string;
  period_start: string;
  period_end: string;
  invoice_url: string | null;
  pdf_url: string | null;
  paid_at: string | null;
  createdAt: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useWorkspacePlan() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<WorkspacePlan>({
    queryKey: ["workspace-plan", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/plans`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useWorkspaceInvoices() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<{ invoices: WorkspaceInvoice[] }>({
    queryKey: ["workspace-invoices", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/plans/invoices`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 120_000,
  });
}

export function useCheckout() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async (body: {
      tier: "starter" | "pro" | "enterprise";
      billing_cycle: "monthly" | "yearly";
      coupon?: string;
    }) => {
      const res = await api.post<{ checkout_url: string; session_id: string }>(
        `/api/${workspaceId}/plans/checkout`,
        body
      );
      return res.data;
    },
    onSuccess: ({ checkout_url }) => {
      window.location.href = checkout_url;
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Error al crear sesión de pago";
      toast.error(msg);
    },
  });
}

export function useBillingPortal() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async () => {
      const res = await api.post<{ portal_url: string }>(
        `/api/${workspaceId}/plans/portal`
      );
      return res.data;
    },
    onSuccess: ({ portal_url }) => {
      window.location.href = portal_url;
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Error al abrir el portal de facturación";
      toast.error(msg);
    },
  });
}

export function useApplyCoupon() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const res = await api.post<{ type: string; value: number; code: string }>(
        `/api/${workspaceId}/plans/apply-coupon`,
        { code }
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Cupón ${data.code} aplicado correctamente`);
      qc.invalidateQueries({ queryKey: ["workspace-plan", workspaceId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Cupón inválido";
      toast.error(msg);
    },
  });
}
