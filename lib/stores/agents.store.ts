import { create } from "zustand";
import type { AgentPresence } from "@/types/agent";

interface AgentsStore {
  onlineAgents: Record<string, AgentPresence>;
  updateAgentPresence: (presence: AgentPresence) => void;
  removeAgent: (agentId: string) => void;
  setOnlineAgents: (agents: AgentPresence[]) => void;
}

export const useAgentsStore = create<AgentsStore>((set) => ({
  onlineAgents: {},

  updateAgentPresence: (presence) => {
    set((state) => ({
      onlineAgents: {
        ...state.onlineAgents,
        [presence.agent_id]: presence,
      },
    }));
  },

  removeAgent: (agentId) => {
    set((state) => {
      const updated = { ...state.onlineAgents };
      delete updated[agentId];
      return { onlineAgents: updated };
    });
  },

  setOnlineAgents: (agents) => {
    const map: Record<string, AgentPresence> = {};
    for (const a of agents) {
      map[a.agent_id] = a;
    }
    set({ onlineAgents: map });
  },
}));
