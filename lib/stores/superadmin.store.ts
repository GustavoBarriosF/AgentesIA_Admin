import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SuperAdminUser {
  _id: string;
  email: string;
  name: string;
  role: "superadmin" | "support";
}

interface SuperAdminStore {
  admin: SuperAdminUser | null;
  token: string | null;
  _hydrated: boolean;
  login: (data: { admin: SuperAdminUser; token: string }) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useSuperAdminStore = create<SuperAdminStore>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      _hydrated: false,

      setHydrated: () => set({ _hydrated: true }),

      login: ({ admin, token }) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("sa_token", token);
          // Mirror token in cookie for middleware-level route protection
          document.cookie = `sa_token_mirror=1; path=/; max-age=28800; SameSite=Lax`;
        }
        set({ admin, token });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("sa_token");
          document.cookie = `sa_token_mirror=; path=/; max-age=0`;
        }
        set({ admin: null, token: null });
        if (typeof window !== "undefined") {
          window.location.href = "/superadmin/login";
        }
      },
    }),
    {
      name: "sa_admin",
      partialize: (state) => ({ admin: state.admin, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
