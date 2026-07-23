import { useQuery } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";

export interface PlanDefinition {
  _id: string;
  tier: "free" | "starter" | "pro" | "enterprise";
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  limits: {
    conversations_per_month: number;
    agents: number;
    channels: number;
    storage_gb: number;
    knowledge_items: number;
    bots: number;
  };
  features: string[];
  trial_days: number;
  active: boolean;
  sort_order: number;
}

export function usePlanDefinitions() {
  return useQuery<PlanDefinition[]>({
    queryKey: ["superadmin", "plan-definitions"],
    queryFn: async () => {
      const res = await apiSuperAdmin.get("/superadmin/plan-definitions");
      return res.data;
    },
    staleTime: 300_000,
  });
}
