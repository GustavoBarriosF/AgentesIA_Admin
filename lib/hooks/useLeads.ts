import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { Lead, LeadStage, LeadsResponse } from "@/types/lead";

// ─── List leads (optionally filtered by stage) ───────────────────────────────

export function useLeads(stage?: LeadStage) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery({
    queryKey: ["leads", workspaceId, stage ?? "all"],
    queryFn: async () => {
      const res = await api.get<LeadsResponse>(`/api/${workspaceId}/leads`, {
        params: { limit: 100, ...(stage ? { stage } : {}) },
      });
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

// ─── Create lead ─────────────────────────────────────────────────────────────

export function useCreateLead() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async (body: {
      contact_id: string;
      stage?: LeadStage;
      value?: number;
      currency?: string;
      tags?: string[];
      conversation_id?: string;
    }) => {
      const res = await api.post<Lead>(`/api/${workspaceId}/leads`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
  });
}

// ─── Update lead ─────────────────────────────────────────────────────────────

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({
      leadId,
      ...body
    }: {
      leadId: string;
      stage?: LeadStage;
      value?: number;
      currency?: string;
      lost_reason?: string;
      assigned_to?: string | null;
      custom_fields?: Record<string, unknown>;
    }) => {
      const res = await api.patch<Lead>(
        `/api/${workspaceId}/leads/${leadId}`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
  });
}

// ─── Add note ────────────────────────────────────────────────────────────────

export function useAddLeadNote() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({
      leadId,
      content,
    }: {
      leadId: string;
      content: string;
    }) => {
      const res = await api.post<Lead>(
        `/api/${workspaceId}/leads/${leadId}/notes`,
        { content }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] });
    },
  });
}
