import { create } from "zustand";
import { toast } from "sonner";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  conversation_id?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsStore {
  toasts: Toast[];
  notifications: Notification[];
  addToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsStore>((set, get) => ({
  toasts: [],
  notifications: [],

  addToast: (newToast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...newToast, id }] }));
    // Drive the visible toast through sonner
    const duration = newToast.duration ?? 4000;
    toast[newToast.type](newToast.message, {
      id,
      duration,
      ...(newToast.action && {
        action: { label: newToast.action.label, onClick: newToast.action.onClick },
      }),
    });
    setTimeout(() => {
      get().dismissToast(id);
    }, duration);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  addNotification: (notification) => {
    const id = crypto.randomUUID();
    set((state) => ({
      notifications: [
        {
          ...notification,
          id,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ],
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  unreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));
