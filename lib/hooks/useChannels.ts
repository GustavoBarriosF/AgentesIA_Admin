import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";

export type ChannelType =
  | "web_widget"
  | "whatsapp"
  | "whatsapp_baileys"
  | "telegram"
  | "api"
  | "facebook_messenger"
  | "instagram_dm"
  | "email"
  | "slack"
  | "teams"
  | "sms"
  | "line";

export interface Channel {
  _id: string;
  workspace_id: string;
  name: string;
  type: ChannelType;
  config: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetaTokenVerification {
  valid: boolean;
  page_name?: string;
  page_id?: string;
  error?: string;
}

const QK = (wid: string) => ["channels", wid];

export function useChannels() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery({
    queryKey: QK(workspaceId ?? ""),
    queryFn: async () => {
      const res = await api.get<Channel[]>(`/api/${workspaceId}/channels`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (body: { name: string; type: ChannelType; config?: Record<string, any> }) => {
      const res = await api.post<Channel>(`/api/${workspaceId}/channels`, body);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") }),
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async ({ channelId, ...body }: { channelId: string; name?: string; config?: Record<string, any>; design?: Record<string, any> }) => {
      const res = await api.patch<Channel>(`/api/${workspaceId}/channels/${channelId}`, body);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") }),
  });
}

export function useToggleChannel() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async ({ channelId, active }: { channelId: string; active: boolean }) => {
      const res = await api.post<Channel>(`/api/${workspaceId}/channels/${channelId}/toggle`, { active });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") }),
  });
}

export function useVerifyEmailCredentials() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await api.post<{ valid: boolean; error?: string }>(
        `/api/${workspaceId}/channels/${channelId}/verify-email`
      );
      return res.data;
    },
  });
}

/**
 * Verifica que un Page Access Token de Meta sea válido.
 * Llama al backend que a su vez consulta la Graph API.
 */
export function useVerifyMetaToken() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (access_token: string) => {
      const res = await api.post<MetaTokenVerification>(
        `/api/${workspaceId}/channels/verify-meta-token`,
        { access_token }
      );
      return res.data;
    },
  });
}

export type BaileysStatus = "disconnected" | "connecting" | "reconnecting" | "qr_ready" | "connected";

export interface BaileysStatusResponse {
  status: BaileysStatus;
  qr: string | null;
  phone: string | null;
}

export function useBaileysStatus(channelId: string | null, enabled = true) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery({
    queryKey: ["baileys-status", workspaceId, channelId],
    queryFn: async () => {
      const res = await api.get<BaileysStatusResponse>(
        `/api/${workspaceId}/channels/${channelId}/baileys/status`
      );
      return res.data;
    },
    enabled: !!workspaceId && !!channelId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "connected" || status === "disconnected") return false;
      return 3000;
    },
    staleTime: 0,
  });
}

export function useBaileysConnect() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await api.post<{ status: string; message: string }>(
        `/api/${workspaceId}/channels/${channelId}/baileys/connect`
      );
      return res.data;
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: ["baileys-status", workspaceId, channelId] });
    },
  });
}

export function useBaileysDisconnect() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (channelId: string) => {
      const res = await api.delete<{ ok: boolean }>(
        `/api/${workspaceId}/channels/${channelId}/baileys/disconnect`
      );
      return res.data;
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: ["baileys-status", workspaceId, channelId] });
    },
  });
}
