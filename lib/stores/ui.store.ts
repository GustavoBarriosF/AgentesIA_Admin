import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface UIStore {
  sidebarCollapsed: boolean;
  contactPanelOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleContactPanel: () => void;
  setContactPanelOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      contactPanelOpen: true,
      theme: "system",

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      toggleContactPanel: () => {
        set((state) => ({ contactPanelOpen: !state.contactPanelOpen }));
      },

      setContactPanelOpen: (open) => {
        set({ contactPanelOpen: open });
      },

      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: "trivox-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
