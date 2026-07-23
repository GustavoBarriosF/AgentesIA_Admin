import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";
import { toast } from "sonner";

export interface CreateCouponPayload {
  code: string;
  type: "percent" | "fixed_amount" | "free_trial_days";
  value: number;
  description?: string;
  applies_to: "all" | "specific_tiers";
  applicable_tiers?: string[];
  max_uses?: number | null;
  valid_from?: string;
  valid_until?: string | null;
}

export function useCreateCoupon() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCouponPayload) => {
      const res = await apiSuperAdmin.post("/superadmin/coupons", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Cupón creado correctamente");
      qc.invalidateQueries({ queryKey: ["superadmin", "coupons"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al crear el cupón";
      toast.error(msg);
    },
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: Partial<CreateCouponPayload> & { id: string; active?: boolean }) => {
      const res = await apiSuperAdmin.patch(`/superadmin/coupons/${id}`, body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Cupón actualizado");
      qc.invalidateQueries({ queryKey: ["superadmin", "coupons"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al actualizar el cupón";
      toast.error(msg);
    },
  });
}
