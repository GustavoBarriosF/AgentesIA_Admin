import type { Contact } from "./contact";
import type { Agent } from "./agent";

export type ConversationStatus =
  | "open"
  | "bot"
  | "pending"
  | "assigned"
  | "resolved"
  | "abandoned";

export type HandledBy = "bot" | "agent" | "hybrid";

export interface Conversation {
  _id: string;
  workspace_id: string;
  // Backend populates these fields but keeps the _id suffix in the key name
  contact_id: Contact;
  channel_id: {
    _id: string;
    name: string;
    type: string;
  };
  agent_id?: Agent;
  status: ConversationStatus;
  handled_by: HandledBy;
  bot_turns: number;
  first_response_time_s?: number;
  resolution_time_s?: number;
  resolved_at?: string;
  csat_score?: number;
  tags: string[];
  last_message_at?: string;
  // Virtual / aggregated — may not always be present
  last_message?: string;
  unread_count?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationFilters {
  status?: ConversationStatus;
  active_only?: boolean;
  agent_id?: string;
  channel_id?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}
