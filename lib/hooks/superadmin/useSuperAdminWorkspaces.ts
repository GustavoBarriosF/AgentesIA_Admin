import { useQuery } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";

export interface WorkspaceListItem {
  _id: string;
  name: string;
  slug: string;
  owner_email: string;
  tier: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "trialing" | "suspended" | "canceled";
  mrr: number;
  conversations_this_month: number;
  created_at: string;
}

export interface WorkspacesResponse {
  workspaces: WorkspaceListItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface WorkspacesFilters {
  search?: string;
  tier?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export function useSuperAdminWorkspaces(filters: WorkspacesFilters = {}) {
  const { search, tier, status, page = 1, limit = 20, sort } = filters;

  return useQuery<WorkspacesResponse>({
    queryKey: ["superadmin", "workspaces", { search, tier, status, page, limit, sort }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tier)   params.set("tier", tier);
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (sort) params.set("sort", sort);

      const res = await apiSuperAdmin.get(`/superadmin/workspaces?${params}`);
      const d = res.data;

      // El backend devuelve { data: [...], total, page, pages }
      // lo mapeamos a la forma que espera la UI
      const workspaces: WorkspaceListItem[] = (d.data ?? []).map(
        (w: {
          _id: string;
          name: string;
          slug: string;
          createdAt: string;
          owner?: { email?: string };
          plan?: {
            tier?: string;
            status?: string;
            usage?: { conversations_this_month?: number };
          };
        }) => ({
          _id:                      w._id,
          name:                     w.name,
          slug:                     w.slug,
          owner_email:              w.owner?.email ?? "—",
          tier:                     (w.plan?.tier ?? "free") as WorkspaceListItem["tier"],
          status:                   (w.plan?.status ?? "active") as WorkspaceListItem["status"],
          mrr:                      0,   // calculado por Stripe, no disponible aquí
          conversations_this_month: w.plan?.usage?.conversations_this_month ?? 0,
          created_at:               w.createdAt,
        })
      );

      return {
        workspaces,
        total: d.total  ?? 0,
        page:  d.page   ?? page,
        limit,
        pages: d.pages  ?? 1,
      };
    },
    staleTime: 30_000,
  });
}
