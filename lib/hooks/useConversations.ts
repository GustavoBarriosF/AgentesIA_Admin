import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { Conversation, ConversationFilters } from "@/types/conversation";

interface ConversationsResponse {
  conversations: Conversation[];
  next_cursor: string | null;
  total: number;
}

// Normalized page shape used internally
interface ConversationsPage {
  data: Conversation[];
  nextCursor: string | undefined;
  total: number;
}

export function useConversations(filters: ConversationFilters = {}) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useInfiniteQuery({
    queryKey: ["conversations", workspaceId, filters],
    queryFn: async ({ pageParam }): Promise<ConversationsPage> => {
      const params = { ...filters, ...(pageParam ? { cursor: pageParam } : {}) };
      const res = await api.get<ConversationsResponse>(
        `/api/${workspaceId}/conversations`,
        { params }
      );
      return {
        data: res.data.conversations,
        nextCursor: res.data.next_cursor ?? undefined,
        total: res.data.total,
      };
    },
    getNextPageParam: (last) => last.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!workspaceId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useConversation(convId: string | null) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery({
    queryKey: ["conversation", workspaceId, convId],
    queryFn: async () => {
      const res = await api.get<Conversation>(
        `/api/${workspaceId}/conversations/${convId}`
      );
      return res.data;
    },
    enabled: !!workspaceId && !!convId,
    staleTime: 30_000,
  });
}

export function useAssignConversation() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: ({ convId, agentId }: { convId: string; agentId: string }) =>
      api.post(`/api/${workspaceId}/conversations/${convId}/assign`, { agent_id: agentId }),
    onSuccess: (_, { convId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", workspaceId, convId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    },
  });
}

export function useAssignDepartment() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: ({ convId, departmentId }: { convId: string; departmentId: string }) =>
      api.post(`/api/${workspaceId}/conversations/${convId}/assign-department`, { department_id: departmentId }),
    onSuccess: (_, { convId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", workspaceId, convId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    },
  });
}

export function useResolveConversation() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: (convId: string) =>
      api.post(`/api/${workspaceId}/conversations/${convId}/resolve`),
    onSuccess: (_, convId) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", workspaceId, convId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    },
  });
}

export function useTransferConversation() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: ({ convId, agentId }: { convId: string; agentId: string }) =>
      api.post(`/api/${workspaceId}/conversations/${convId}/transfer`, { agent_id: agentId }),
    onSuccess: (_, { convId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", workspaceId, convId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    },
  });
}

export function useReopenConversation() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: (convId: string) =>
      api.post(`/api/${workspaceId}/conversations/${convId}/reopen`),
    onSuccess: (_, convId) => {
      queryClient.invalidateQueries({ queryKey: ["conversation", workspaceId, convId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: (convId: string) =>
      api.delete(`/api/${workspaceId}/conversations/${convId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
    },
  });
}
