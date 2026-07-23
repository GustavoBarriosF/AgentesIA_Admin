import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

export type PaymentLinkStatus = "pending" | "paid" | "expired" | "failed" | "cancelled";

export interface PaymentLinkItem {
  product_id?: string | null;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface PaymentLink {
  _id: string;
  workspace_id: string;
  conversation_id?: string | null;
  contact_id?: string | null;
  provider: string;
  provider_id: string;
  provider_payment_id?: string | null;
  url: string;
  amount: number;
  currency: string;
  description: string;
  items: PaymentLinkItem[];
  status: PaymentLinkStatus;
  expires_at?: string | null;
  paid_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentLinksResponse {
  data: PaymentLink[];
  total: number;
}

export function usePaymentLinks(params?: {
  status?: PaymentLinkStatus;
  conversation_id?: string;
  provider?: string;
  limit?: number;
  offset?: number;
}) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<PaymentLinksResponse>({
    queryKey: ["payment-links", workspaceId, params],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/payment-links`, { params });
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useCreatePaymentLink() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      provider: string;
      currency: string;
      items: Array<{
        product_id?: string;
        name?: string;
        quantity?: number;
        unit_price?: number;
      }>;
      conversation_id?: string;
      description?: string;
      payer_email?: string;
      send_to_chat?: boolean;
    }) => {
      const res = await api.post<PaymentLink>(`/api/${workspaceId}/payment-links`, body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Link de pago creado y enviado al chat");
      qc.invalidateQueries({ queryKey: ["payment-links", workspaceId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error al crear link de pago";
      toast.error(msg);
    },
  });
}
