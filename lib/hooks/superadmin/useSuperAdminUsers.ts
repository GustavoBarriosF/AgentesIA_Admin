import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";
import { toast } from "sonner";
import type { SuperAdminUser } from "@/lib/stores/superadmin.store";

export interface SuperAdminUserFull extends SuperAdminUser {
  active: boolean;
  last_login: string | null;
  createdAt: string;
}

export function useSuperAdminUsers() {
  return useQuery<SuperAdminUserFull[]>({
    queryKey: ["superadmin", "users"],
    queryFn: async () => {
      const res = await apiSuperAdmin.get("/superadmin/auth/users");
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateSuperAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      email: string;
      password: string;
      name: string;
      role: "superadmin" | "support";
    }) => {
      const res = await apiSuperAdmin.post("/superadmin/auth/users", body);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Usuario creado correctamente");
      qc.invalidateQueries({ queryKey: ["superadmin", "users"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Error al crear el usuario";
      toast.error(msg);
    },
  });
}

export function useUpdateSuperAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      ...body
    }: {
      userId: string;
      name?: string;
      role?: "superadmin" | "support";
      active?: boolean;
    }) => {
      const res = await apiSuperAdmin.patch(
        `/superadmin/auth/users/${userId}`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Usuario actualizado");
      qc.invalidateQueries({ queryKey: ["superadmin", "users"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Error al actualizar";
      toast.error(msg);
    },
  });
}

export function useDeleteSuperAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiSuperAdmin.delete(`/superadmin/auth/users/${userId}`);
    },
    onSuccess: () => {
      toast.success("Usuario eliminado");
      qc.invalidateQueries({ queryKey: ["superadmin", "users"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Error al eliminar";
      toast.error(msg);
    },
  });
}
