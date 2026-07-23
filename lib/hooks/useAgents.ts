import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { Agent } from "@/types/agent";

export function useAgents() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: async () => {
      const res = await api.get<Agent[]>(`/api/${workspaceId}/agents`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}
