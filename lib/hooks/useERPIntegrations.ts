import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

export type ERPProvider = "alegra" | "siigo" | "quickbooks";

export interface ERPIntegration {
  _id: string;
  workspace_id: string;
  provider: ERPProvider;
  active: boolean;
  config: {
    currency?: string;
    company_name?: string;
    tax_included?: boolean;
    field_map?: Record<string, string>;
  };
  /** Indica qué campos de credenciales están configurados (sin exponer valores) */
  credentials_configured: Record<string, boolean | undefined> & { _encrypted?: boolean };
  last_sync: string | null;
  last_error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ERPSyncLogEntry {
  timestamp: string;
  action: string;
  status: "success" | "error";
  detail: string | null;
}

export interface ERPSyncLog {
  last_sync: string | null;
  last_error: string | null;
  sync_log: ERPSyncLogEntry[];
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function useERPIntegrations() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<ERPIntegration[]>({
    queryKey: ["erp-integrations", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/erp-integrations`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateERPIntegration() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      credentials,
      config,
    }: {
      provider: ERPProvider;
      credentials: Record<string, string>;
      config?: ERPIntegration["config"];
    }) => {
      const res = await api.post<ERPIntegration>(
        `/api/${workspaceId}/erp-integrations`,
        { provider, credentials, config }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Integración ERP conectada correctamente");
      qc.invalidateQueries({ queryKey: ["erp-integrations", workspaceId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al conectar integración ERP";
      toast.error(msg);
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateERPIntegration() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      credentials,
      config,
      active,
    }: {
      id: string;
      credentials?: Record<string, string>;
      config?: ERPIntegration["config"];
      active?: boolean;
    }) => {
      const res = await api.put<ERPIntegration>(
        `/api/${workspaceId}/erp-integrations/${id}`,
        { credentials, config, active }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Integración actualizada");
      qc.invalidateQueries({ queryKey: ["erp-integrations", workspaceId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al actualizar integración";
      toast.error(msg);
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteERPIntegration() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/${workspaceId}/erp-integrations/${id}`);
    },
    onSuccess: () => {
      toast.success("Integración desconectada");
      qc.invalidateQueries({ queryKey: ["erp-integrations", workspaceId] });
    },
    onError: () => toast.error("No se pudo desconectar la integración"),
  });
}

// ─── Test connection ──────────────────────────────────────────────────────────

export function useTestERPConnection() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<{ valid: boolean; error?: string }>(
        `/api/${workspaceId}/erp-integrations/${id}/test`
      );
      return res.data;
    },
  });
}

// ─── Sync log ─────────────────────────────────────────────────────────────────

export function useERPSyncLog(id: string | null) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<ERPSyncLog>({
    queryKey: ["erp-sync-log", workspaceId, id],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/erp-integrations/${id}/logs`);
      return res.data;
    },
    enabled: !!workspaceId && !!id,
    staleTime: 30_000,
  });
}
