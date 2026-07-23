import { useQuery } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";

export interface Invoice {
  _id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void" | "uncollectible";
  period_start: string;
  period_end: string;
  tier: string;
  billing_cycle: string;
  invoice_url: string | null;
  pdf_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface InvoicesFilters {
  workspace?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  pages: number;
  total_amount: number;
}

export function useSuperAdminInvoices(filters: InvoicesFilters = {}) {
  const { workspace, status, date_from, date_to, page = 1, limit = 20 } = filters;

  return useQuery<InvoicesResponse>({
    queryKey: ["superadmin", "invoices", { workspace, status, date_from, date_to, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (workspace) params.set("workspace_id", workspace);
      if (status)   params.set("status", status);
      if (date_from) params.set("date_from", date_from);
      if (date_to)   params.set("date_to", date_to);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await apiSuperAdmin.get(`/superadmin/billing/invoices?${params}`);
      const d = res.data;

      // Backend retorna { data, total, page, pages, total_amount_cents }
      return {
        invoices:     d.data          ?? [],
        total:        d.total         ?? 0,
        page:         d.page          ?? page,
        pages:        d.pages         ?? 1,
        total_amount: d.total_amount_cents ?? 0,
      } satisfies InvoicesResponse;
    },
    staleTime: 60_000,
  });
}
