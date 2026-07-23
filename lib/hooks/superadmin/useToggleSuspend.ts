import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";
import { toast } from "sonner";

export function useSuspendWorkspace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      reason,
    }: {
      workspaceId: string;
      reason: string;
    }) => {
      const res = await apiSuperAdmin.post(
        `/superadmin/workspaces/${workspaceId}/suspend`,
        { reason }
      );
      return res.data;
    },
    onSuccess: (_, { workspaceId }) => {
      toast.success("Workspace suspendido");
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces", workspaceId] });
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al suspender";
      toast.error(msg);
    },
  });
}

export function useActivateWorkspace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId }: { workspaceId: string }) => {
      const res = await apiSuperAdmin.post(
        `/superadmin/workspaces/${workspaceId}/activate`
      );
      return res.data;
    },
    onSuccess: (_, { workspaceId }) => {
      toast.success("Workspace reactivado");
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces", workspaceId] });
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al activar";
      toast.error(msg);
    },
  });
}
