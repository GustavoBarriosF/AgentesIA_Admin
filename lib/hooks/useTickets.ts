import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type {
  Ticket,
  TicketFilters,
  CreateTicketInput,
  UpdateTicketInput,
} from "@/types/ticket";

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export function useTickets(filters: TicketFilters = {}) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const { page = 1, limit = 20, status, priority, assigned_to, department_id } = filters;

  return useQuery({
    queryKey: ["tickets", workspaceId, page, limit, status, priority, assigned_to, department_id],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit };
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (assigned_to) params.assigned_to = assigned_to;
      if (department_id) params.department_id = department_id;

      const res = await api.get<TicketsResponse>(
        `/api/${workspaceId}/tickets`,
        { params }
      );
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useTicket(ticketId: string | null) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery({
    queryKey: ["ticket", workspaceId, ticketId],
    queryFn: async () => {
      const res = await api.get<Ticket>(
        `/api/${workspaceId}/tickets/${ticketId}`
      );
      return res.data;
    },
    enabled: !!workspaceId && !!ticketId,
    staleTime: 30_000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async (input: CreateTicketInput) => {
      const res = await api.post<Ticket>(
        `/api/${workspaceId}/tickets`,
        input
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", workspaceId] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({
      ticketId,
      input,
    }: {
      ticketId: string;
      input: UpdateTicketInput;
    }) => {
      const res = await api.patch<Ticket>(
        `/api/${workspaceId}/tickets/${ticketId}`,
        input
      );
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["ticket", workspaceId, updated._id],
        updated
      );
      queryClient.invalidateQueries({ queryKey: ["tickets", workspaceId] });
    },
  });
}

export function useAddTicketNote() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const res = await api.post<Ticket>(
        `/api/${workspaceId}/tickets/${ticketId}/notes`,
        { content }
      );
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", workspaceId, updated._id], updated);
    },
  });
}

export function useAddTicketPublicNote() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
      const res = await api.post<Ticket>(
        `/api/${workspaceId}/tickets/${ticketId}/public-notes`,
        { content }
      );
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", workspaceId, updated._id], updated);
    },
  });
}
