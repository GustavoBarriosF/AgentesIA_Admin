import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { AnalyticsOverview, AnalyticsDateRange, TokenUsage } from "@/types/analytics";

export function useAnalyticsOverview(range: AnalyticsDateRange) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery({
    queryKey: ["analytics", "overview", workspaceId, range.from, range.to],
    queryFn: async () => {
      const res = await api.get<AnalyticsOverview>(
        `/api/${workspaceId}/analytics/overview`,
        { params: { from: range.from, to: range.to } }
      );
      return res.data;
    },
    enabled: !!workspaceId && !!range.from && !!range.to,
    staleTime: 5 * 60_000, // 5 min
  });
}

export function useTokenUsage(range: AnalyticsDateRange) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery({
    queryKey: ["analytics", "token-usage", workspaceId, range.from, range.to],
    queryFn: async () => {
      const res = await api.get<TokenUsage>(
        `/api/${workspaceId}/analytics/token-usage`,
        { params: { from: range.from, to: range.to } }
      );
      return res.data;
    },
    enabled: !!workspaceId && !!range.from && !!range.to,
    staleTime: 5 * 60_000,
  });
}
