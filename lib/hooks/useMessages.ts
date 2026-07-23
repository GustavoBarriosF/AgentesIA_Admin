import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { Message } from "@/types/message";
import type { PaginatedResponse } from "@/types/api";

export function useMessages(convId: string | null) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useInfiniteQuery({
    queryKey: ["messages", workspaceId, convId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, unknown> = { limit: 40 };
      if (pageParam) params.before = pageParam;
      // El backend devuelve un array plano, lo envolvemos en { data, nextCursor }
      const res = await api.get<Message[]>(
        `/api/${workspaceId}/messages/${convId}`,
        { params }
      );
      const messages = Array.isArray(res.data) ? res.data : [];
      return {
        data: messages,
        nextCursor: messages.length === 40 ? messages[0]?._id : undefined,
      } as PaginatedResponse<Message>;
    },
    getNextPageParam: (last) => last.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !!workspaceId && !!convId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({
      convId,
      content,
    }: {
      convId: string;
      content: string;
    }) => {
      const res = await api.post<Message>(
        `/api/${workspaceId}/messages/${convId}`,
        { content, type: "text" }
      );
      return res.data;
    },
    onMutate: async ({ convId, content }) => {
      const queryKey = ["messages", workspaceId, convId];
      await queryClient.cancelQueries({ queryKey });

      const optimistic: Message = {
        _id: `optimistic-${Date.now()}`,
        workspace_id: workspaceId!,
        conversation_id: convId,
        sender_type: "agent",
        type: "text",
        content,
        _pending: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, (old: { pages: { data: Message[] }[] } | undefined) => {
        if (!old) return old;
        const pages = [...old.pages];
        const last = pages[pages.length - 1];
        pages[pages.length - 1] = {
          ...last,
          data: [...last.data, optimistic],
        };
        return { ...old, pages };
      });

      return { optimistic, queryKey };
    },
    onSuccess: (message, { convId }, context) => {
      if (!context) return;
      queryClient.setQueryData(context.queryKey, (old: { pages: { data: Message[] }[] } | undefined) => {
        if (!old) return old;
        const pages = old.pages.map((page) => ({
          ...page,
          data: page.data.map((m) =>
            m._id === context.optimistic._id ? message : m
          ),
        }));
        return { ...old, pages };
      });
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(context.queryKey, (old: { pages: { data: Message[] }[] } | undefined) => {
        if (!old) return old;
        const pages = old.pages.map((page) => ({
          ...page,
          data: page.data.map((m) =>
            m._id === context.optimistic._id
              ? { ...m, _pending: false, _error: true }
              : m
          ),
        }));
        return { ...old, pages };
      });
    },
  });
}

export function useMarkAsRead() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: (convId: string) =>
      api.post(`/api/${workspaceId}/messages/${convId}/read`),
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({
      convId,
      file,
    }: {
      convId: string;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post<{ message: Message }>(
        `/api/${workspaceId}/messages/${convId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return { message: res.data.message, convId };
    },
    onSuccess: ({ message, convId }) => {
      const queryKey = ["messages", workspaceId, convId];
      queryClient.setQueryData(queryKey, (old: { pages: { data: Message[] }[] } | undefined) => {
        if (!old) return old;
        const pages = [...old.pages];
        const last = pages[pages.length - 1];
        if (last.data.some((m) => m._id === message._id)) return old;
        pages[pages.length - 1] = { ...last, data: [...last.data, message] };
        return { ...old, pages };
      });
    },
  });
}
