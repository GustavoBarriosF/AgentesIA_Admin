import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { BotAgent, BotAgentType } from "@/types/bot";

const QK = (wid: string) => ["bots", wid];

export function useBots(type?: BotAgentType) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery({
    queryKey: [...QK(workspaceId ?? ""), type ?? "all"],
    queryFn: async () => {
      const res = await api.get<BotAgent[]>(`/api/${workspaceId}/bots`, {
        params: type ? { type } : {},
      });
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useCreateBot() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (body: Partial<BotAgent> & { name: string; type: BotAgentType }) => {
      const res = await api.post<BotAgent>(`/api/${workspaceId}/bots`, body);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") }),
  });
}

export function useUpdateBot() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async ({ botId, ...body }: Partial<BotAgent> & { botId: string }) => {
      const res = await api.patch<BotAgent>(`/api/${workspaceId}/bots/${botId}`, body);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") }),
  });
}

export function useDeleteBot() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (botId: string) => {
      await api.delete(`/api/${workspaceId}/bots/${botId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") }),
  });
}
