import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignType   = "immediate" | "drip" | "trigger";
export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "completed" | "cancelled";
export type CampaignChannelType = "whatsapp" | "telegram" | "email" | "facebook_messenger" | "instagram_dm";
export type ContactStatus  = "pending" | "sent" | "delivered" | "read" | "replied" | "failed" | "opted_out" | "skipped";

export interface CampaignAudience {
  type: "all" | "segment" | "manual";
  filters?: {
    channel_type?: string;
    has_phone?: boolean;
    has_email?: boolean;
    created_after?: string;
    created_before?: string;
  };
  contact_ids?: string[];
  total_count?: number;
}

export interface CampaignTemplate {
  type: "text" | "hsm";
  content: string;
  hsm_name?: string;
  hsm_language?: string;
  hsm_components?: unknown;
  subject?: string;
  content_b?: string;
  ab_test_enabled?: boolean;
  ab_split_percent?: number;
}

export interface CampaignSchedule {
  send_at?: string | null;
  timezone?: string;
  allowed_hours?: { start: number; end: number };
  allowed_days?: number[];
}

export interface DripStep {
  delay_days: number;
  template: { type: "text" | "hsm"; content: string; subject?: string };
}

export interface CampaignStats {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  replied: number;
  failed: number;
  opted_out: number;
  skipped: number;
  sent_a: number;
  replied_a: number;
  sent_b: number;
  replied_b: number;
}

export interface Campaign {
  _id: string;
  workspace_id: string;
  name: string;
  channel_id: string;
  channel_type: CampaignChannelType;
  type: CampaignType;
  status: CampaignStatus;
  audience: CampaignAudience;
  template: CampaignTemplate;
  schedule: CampaignSchedule;
  drip_steps: DripStep[];
  trigger?: { event: string; inactivity_days?: number } | null;
  utm?: { source?: string; medium?: string; campaign?: string };
  stats: CampaignStats;
  launched_at: string | null;
  completed_at: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignContactRecord {
  _id: string;
  campaign_id: string;
  contact_id: { _id: string; name: string; email?: string; phone?: string } | string;
  variant: "a" | "b" | null;
  drip_step: number;
  status: ContactStatus;
  attempts: number;
  failed_reason?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  replied_at?: string;
}

export interface CampaignRates {
  delivery_rate: number;
  read_rate: number;
  reply_rate: number;
  fail_rate: number;
  opt_out_rate: number;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCampaigns(status?: CampaignStatus) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery<{ campaigns: Campaign[]; total: number }>({
    queryKey: ["campaigns", workspaceId, status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : "";
      const res = await api.get(`/api/${workspaceId}/campaigns${params}`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
    refetchInterval: 15_000, // refrescar stats en tiempo real
  });
}

export function useCampaign(id: string | null) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery<Campaign>({
    queryKey: ["campaign", workspaceId, id],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/campaigns/${id}`);
      return res.data;
    },
    enabled: !!workspaceId && !!id,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function useCampaignStats(id: string | null) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery<{ campaign_id: string; status: CampaignStatus; stats: CampaignStats; rates: CampaignRates }>({
    queryKey: ["campaign-stats", workspaceId, id],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/campaigns/${id}/stats`);
      return res.data;
    },
    enabled: !!workspaceId && !!id,
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}

export function useCampaignContacts(id: string | null, statusFilter?: ContactStatus) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery<{ contacts: CampaignContactRecord[]; total: number }>({
    queryKey: ["campaign-contacts", workspaceId, id, statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}&limit=100` : "?limit=100";
      const res = await api.get(`/api/${workspaceId}/campaigns/${id}/contacts${params}`);
      return res.data;
    },
    enabled: !!workspaceId && !!id,
    staleTime: 15_000,
  });
}

export function useCreateCampaign() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const res = await api.post<Campaign>(`/api/${workspaceId}/campaigns`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Campaña creada");
      qc.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error al crear campaña";
      toast.error(msg);
    },
  });
}

export function useUpdateCampaign() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Campaign> & { id: string }) => {
      const res = await api.put<Campaign>(`/api/${workspaceId}/campaigns/${id}`, data);
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success("Campaña actualizada");
      qc.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
      qc.invalidateQueries({ queryKey: ["campaign", workspaceId, vars.id] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error al actualizar";
      toast.error(msg);
    },
  });
}

export function useDeleteCampaign() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/${workspaceId}/campaigns/${id}`);
    },
    onSuccess: () => {
      toast.success("Campaña eliminada");
      qc.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
    },
    onError: () => toast.error("No se pudo eliminar la campaña"),
  });
}

export function useLaunchCampaign() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<Campaign>(`/api/${workspaceId}/campaigns/${id}/launch`);
      return res.data;
    },
    onSuccess: (_, id) => {
      toast.success("Campaña lanzada");
      qc.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
      qc.invalidateQueries({ queryKey: ["campaign", workspaceId, id] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error al lanzar campaña";
      toast.error(msg);
    },
  });
}

export function usePauseCampaign() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<Campaign>(`/api/${workspaceId}/campaigns/${id}/pause`);
      return res.data;
    },
    onSuccess: (_, id) => {
      toast.success("Campaña pausada");
      qc.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
      qc.invalidateQueries({ queryKey: ["campaign", workspaceId, id] });
    },
    onError: () => toast.error("Error al pausar campaña"),
  });
}

export function useCancelCampaign() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<Campaign>(`/api/${workspaceId}/campaigns/${id}/cancel`);
      return res.data;
    },
    onSuccess: (_, id) => {
      toast.success("Campaña cancelada");
      qc.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
      qc.invalidateQueries({ queryKey: ["campaign", workspaceId, id] });
    },
    onError: () => toast.error("Error al cancelar campaña"),
  });
}

export function usePreviewAudience() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (data: { channel_id: string; audience?: Partial<CampaignAudience> }) => {
      const res = await api.post<{ count: number }>(`/api/${workspaceId}/campaigns/preview-audience`, data);
      return res.data;
    },
  });
}
