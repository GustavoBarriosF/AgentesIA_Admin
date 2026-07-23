export type AgentStatus = "online" | "away" | "offline";

export interface AgentUser {
  _id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface Agent {
  _id: string;
  workspace_id: string;
  // When fetched via GET /agents endpoint, user is populated as "user_id"
  user_id?: AgentUser;
  // Alias used in some contexts
  user?: AgentUser;
  status: AgentStatus;
  skills: string[];
  max_chats: number;
  active_chats: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPresence {
  agent_id: string;
  status: AgentStatus;
  active_chats: number;
}
