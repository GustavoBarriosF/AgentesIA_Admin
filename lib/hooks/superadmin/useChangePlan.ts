import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";
import { toast } from "sonner";

interface ChangePlanPayload {
  workspaceId: string;
  tier: string;
  note?: string;
  coupon?: string;
}

export function useChangePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, ...body }: ChangePlanPayload) => {
      const res = await apiSuperAdmin.post(
        `/superadmin/workspaces/${workspaceId}/plan`,
        body
      );
      return res.data;
    },
    onSuccess: (_, { workspaceId }) => {
      toast.success("Plan actualizado correctamente");
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces", workspaceId] });
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al cambiar el plan";
      toast.error(msg);
    },
  });
}
