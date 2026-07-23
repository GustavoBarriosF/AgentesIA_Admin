import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { Contact } from "@/types/contact";

interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}

interface ContactsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useContacts(params: ContactsParams = {}) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const { page = 1, limit = 20, search = "" } = params;

  return useQuery({
    queryKey: ["contacts", workspaceId, page, limit, search],
    queryFn: async () => {
      const res = await api.get<ContactsResponse>(
        `/api/${workspaceId}/contacts`,
        { params: { page, limit, ...(search ? { search } : {}) } }
      );
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  });
}

export function useContact(contactId: string | null) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery({
    queryKey: ["contact", workspaceId, contactId],
    queryFn: async () => {
      const res = await api.get<Contact>(
        `/api/${workspaceId}/contacts/${contactId}`
      );
      return res.data;
    },
    enabled: !!workspaceId && !!contactId,
    staleTime: 60_000,
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: (contactId: string) =>
      api.delete(`/api/${workspaceId}/contacts/${contactId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", workspaceId] });
    },
  });
}

export function useUpdateContactFields() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({
      contactId,
      fields,
    }: {
      contactId: string;
      fields: Record<string, unknown>;
    }) => {
      const res = await api.patch<Contact>(
        `/api/${workspaceId}/contacts/${contactId}/fields`,
        fields
      );
      return res.data;
    },
    onSuccess: (updated) => {
      // Update detail cache
      queryClient.setQueryData(
        ["contact", workspaceId, updated._id],
        updated
      );
      // Invalidate list so it reflects changes
      queryClient.invalidateQueries({ queryKey: ["contacts", workspaceId] });
    },
  });
}
