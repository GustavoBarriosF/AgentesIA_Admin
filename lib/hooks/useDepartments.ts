import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";
import type { Department } from "@/types/workspace";

const QK = (wid: string) => ["departments", wid];

export function useDepartments() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery<Department[]>({
    queryKey: QK(workspaceId ?? ""),
    queryFn: async () => {
      const res = await api.get<Department[]>(`/api/${workspaceId}/departments`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useCreateDepartment() {
  const qc          = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (body: { name: string; description?: string; color?: string }) => {
      const res = await api.post<Department>(`/api/${workspaceId}/departments`, body);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
      toast.success("Departamento creado");
    },
    onError: () => toast.error("No se pudo crear el departamento"),
  });
}

export function useUpdateDepartment() {
  const qc          = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async ({ deptId, ...body }: { deptId: string; name?: string; description?: string; color?: string }) => {
      const res = await api.patch<Department>(`/api/${workspaceId}/departments/${deptId}`, body);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
      toast.success("Departamento actualizado");
    },
    onError: () => toast.error("No se pudo actualizar el departamento"),
  });
}

export function useDeleteDepartment() {
  const qc          = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useMutation({
    mutationFn: async (deptId: string) => {
      await api.delete(`/api/${workspaceId}/departments/${deptId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
      qc.invalidateQueries({ queryKey: ["workspace-members", workspaceId ?? ""] });
      toast.success("Departamento eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el departamento"),
  });
}
