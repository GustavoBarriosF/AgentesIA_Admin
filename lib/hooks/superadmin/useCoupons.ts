import { useQuery } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";

export interface Coupon {
  _id: string;
  code: string;
  type: "percent" | "fixed_amount" | "free_trial_days";
  value: number;
  applies_to: "all" | "specific_tiers";
  applicable_tiers: string[];
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  description: string;
}

export function useCoupons() {
  return useQuery<Coupon[]>({
    queryKey: ["superadmin", "coupons"],
    queryFn: async () => {
      const res = await apiSuperAdmin.get("/superadmin/coupons");
      // Backend retorna { data: [...], total, page, pages }
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 60_000,
  });
}
