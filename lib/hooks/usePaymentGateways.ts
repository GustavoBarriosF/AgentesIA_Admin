import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

export type GatewayProvider = "stripe" | "mercadopago" | "paypal" | "wompi" | "epayco" | "payu";

export interface PaymentGateway {
  _id: string;
  workspace_id: string;
  provider: GatewayProvider;
  active: boolean;
  test_mode: boolean;
  /** Indica qué campos de credenciales están configurados (true/false por campo, sin valores) */
  credentials_configured: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayVerificationResult {
  valid: boolean;
  account_id?: string;
  display_name?: string;
  user_id?: number;
  email?: string;
  site_id?: string;
  error?: string;
}

export function usePaymentGateways() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<PaymentGateway[]>({
    queryKey: ["payment-gateways", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/payment-gateways`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useSavePaymentGateway() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      credentials,
      active,
      test_mode,
    }: {
      provider: GatewayProvider;
      credentials?: Record<string, string>;
      active?: boolean;
      test_mode?: boolean;
    }) => {
      const res = await api.put<PaymentGateway>(
        `/api/${workspaceId}/payment-gateways/${provider}`,
        { credentials, active, test_mode }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Pasarela guardada correctamente");
      qc.invalidateQueries({ queryKey: ["payment-gateways", workspaceId] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error al guardar pasarela";
      toast.error(msg);
    },
  });
}

export function useVerifyPaymentGateway() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async (provider: GatewayProvider) => {
      const res = await api.post<GatewayVerificationResult>(
        `/api/${workspaceId}/payment-gateways/${provider}/verify`
      );
      return res.data;
    },
  });
}

export function useDeletePaymentGateway() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (provider: GatewayProvider) => {
      await api.delete(`/api/${workspaceId}/payment-gateways/${provider}`);
    },
    onSuccess: () => {
      toast.success("Pasarela eliminada");
      qc.invalidateQueries({ queryKey: ["payment-gateways", workspaceId] });
    },
    onError: () => toast.error("No se pudo eliminar la pasarela"),
  });
}
