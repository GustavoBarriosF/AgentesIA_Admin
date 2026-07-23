import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";
import { toast } from "sonner";
import type { PlanDefinition } from "./usePlanDefinitions";

type UpdatePlanPayload = Partial<Omit<PlanDefinition, "_id">> & { id: string };

export function useUpdatePlanDefinition() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: UpdatePlanPayload) => {
      const res = await apiSuperAdmin.patch(
        `/superadmin/plan-definitions/${id}`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Plan actualizado correctamente");
      qc.invalidateQueries({ queryKey: ["superadmin", "plan-definitions"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al actualizar el plan";
      toast.error(msg);
    },
  });
}

export function useSyncPlansToStripe() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiSuperAdmin.post(
        "/superadmin/plan-definitions/sync-to-stripe"
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Planes sincronizados con Stripe");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al sincronizar con Stripe";
      toast.error(msg);
    },
  });
}

export function useSeedDefaultPlans() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiSuperAdmin.post(
        "/superadmin/plan-definitions/seed-defaults"
      );
      return res.data as { created: number; skipped: number };
    },
    onSuccess: (data) => {
      toast.success(
        data.created > 0
          ? `${data.created} planes creados correctamente`
          : "Los planes ya estaban configurados"
      );
      qc.invalidateQueries({ queryKey: ["superadmin", "plan-definitions"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Error al crear los planes";
      toast.error(msg);
    },
  });
}
