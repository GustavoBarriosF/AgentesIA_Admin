import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";
import { toast } from "sonner";

export function useGrantTrial() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      days,
    }: {
      workspaceId: string;
      days: number;
    }) => {
      const res = await apiSuperAdmin.post(
        `/superadmin/workspaces/${workspaceId}/trial`,
        { days }
      );
      return res.data;
    },
    onSuccess: (_, { workspaceId }) => {
      toast.success("Trial otorgado correctamente");
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces", workspaceId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al otorgar trial";
      toast.error(msg);
    },
  });
}
