import { create } from "zustand";
import type { ConversationFilters, ConversationStatus } from "@/types/conversation";

interface ConversationsStore {
  selectedConversationId: string | null;
  filters: ConversationFilters;
  unreadCounts: Record<string, number>;
  selectConversation: (id: string | null) => void;
  setFilters: (filters: Partial<ConversationFilters>) => void;
  resetFilters: () => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

const defaultFilters: ConversationFilters = {
  limit: 30,
  active_only: true,
};

export const useConversationsStore = create<ConversationsStore>((set) => ({
  selectedConversationId: null,
  filters: defaultFilters,
  unreadCounts: {},

  selectConversation: (id) => {
    set((state) => ({
      selectedConversationId: id,
      unreadCounts: id
        ? { ...state.unreadCounts, [id]: 0 }
        : state.unreadCounts,
    }));
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters, cursor: undefined },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  incrementUnread: (conversationId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] ?? 0) + 1,
      },
    }));
  },

  clearUnread: (conversationId) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    }));
  },
}));
