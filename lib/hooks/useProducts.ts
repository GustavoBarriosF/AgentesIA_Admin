import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

export interface Product {
  _id: string;
  workspace_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sku?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
}

export function useProducts(params?: { active?: boolean; limit?: number; offset?: number }) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<ProductsResponse>({
    queryKey: ["products", workspaceId, params],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/products`, { params });
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      name: string;
      description?: string;
      price: number;
      currency?: string;
      images?: string[];
      sku?: string;
    }) => {
      const res = await api.post<Product>(`/api/${workspaceId}/products`, body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Producto creado");
      qc.invalidateQueries({ queryKey: ["products", workspaceId] });
    },
    onError: () => toast.error("No se pudo crear el producto"),
  });
}

export function useUpdateProduct() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Product> & { id: string }) => {
      const res = await api.put<Product>(`/api/${workspaceId}/products/${id}`, body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Producto actualizado");
      qc.invalidateQueries({ queryKey: ["products", workspaceId] });
    },
    onError: () => toast.error("No se pudo actualizar el producto"),
  });
}

export function useDeleteProduct() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/api/${workspaceId}/products/${productId}`);
    },
    onSuccess: () => {
      toast.success("Producto eliminado");
      qc.invalidateQueries({ queryKey: ["products", workspaceId] });
    },
    onError: () => toast.error("No se pudo eliminar el producto"),
  });
}
