import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";
import type { Workspace, WorkspaceMember } from "@/types/workspace";

const QK         = (wid: string) => ["workspace", wid];
const MEMBERS_QK = (wid: string) => ["workspace-members", wid];

// ─── Workspace ────────────────────────────────────────────────────────────────

export function useWorkspace() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery({
    queryKey: QK(workspaceId ?? ""),
    queryFn: async () => {
      const res = await api.get<Workspace>(`/api/${workspaceId}`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (body: {
      name?: string;
      branding?: Partial<Workspace["branding"]>;
      settings?: Partial<Workspace["settings"]>;
    }) => {
      const res = await api.patch<Workspace>(`/api/${workspaceId}`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
    },
  });
}

// ─── Members ──────────────────────────────────────────────────────────────────

export function useWorkspaceMembers() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery({
    queryKey: MEMBERS_QK(workspaceId ?? ""),
    queryFn: async () => {
      const res = await api.get<WorkspaceMember[]>(`/api/${workspaceId}/members`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (body: {
      name: string;
      email: string;
      password: string;
      role: "admin" | "agent" | "viewer";
      department_id?: string | null;
    }) => {
      const res = await api.post<WorkspaceMember>(`/api/${workspaceId}/members`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QK(workspaceId ?? "") });
      toast.success("Miembro creado correctamente");
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? "No se pudo crear el miembro";
      toast.error(msg);
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (body: {
      email: string;
      role: WorkspaceMember["role"];
      department_id?: string | null;
    }) => {
      const res = await api.post<WorkspaceMember>(`/api/${workspaceId}/members/invite`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QK(workspaceId ?? "") });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async ({
      memberId,
      ...body
    }: {
      memberId: string;
      role?: WorkspaceMember["role"];
      active?: boolean;
      department_id?: string | null;
    }) => {
      const res = await api.patch<WorkspaceMember>(
        `/api/${workspaceId}/members/${memberId}`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QK(workspaceId ?? "") });
    },
  });
}
