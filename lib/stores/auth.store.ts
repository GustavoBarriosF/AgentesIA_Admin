import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, WorkspaceMembership } from "@/types/user";

interface AuthStore {
  user: User | null;
  token: string | null;
  workspaces: WorkspaceMembership[];
  activeWorkspace: WorkspaceMembership | null;
  _hydrated: boolean;
  login: (data: {
    user: User;
    token: string;
    workspaces: WorkspaceMembership[];
  }) => void;
  logout: () => void;
  setActiveWorkspace: (workspace: WorkspaceMembership) => void;
  setWorkspaces: (workspaces: WorkspaceMembership[]) => void;
  setHydrated: () => void;
  updateUser: (patch: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      workspaces: [],
      activeWorkspace: null,
      _hydrated: false,

      setHydrated: () => set({ _hydrated: true }),

      login: ({ user, token, workspaces }) => {
        const activeWorkspace = workspaces[0] ?? null;
        set({ user, token, workspaces, activeWorkspace });
      },

      logout: () => {
        set({ user: null, token: null, workspaces: [], activeWorkspace: null });
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      },

      setActiveWorkspace: (workspace) => {
        set({ activeWorkspace: workspace });
      },

      setWorkspaces: (workspaces) => {
        set({ workspaces });
      },

      updateUser: (patch) => {
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user }));
      },
    }),
    {
      name: "trivox-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        workspaces: state.workspaces,
        activeWorkspace: state.activeWorkspace,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
