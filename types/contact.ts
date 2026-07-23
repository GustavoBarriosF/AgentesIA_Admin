export interface Contact {
  _id: string;
  workspace_id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  channel_ref: string;
  channel_type: string;
  custom_fields: Record<string, unknown>;
  conversation_count: number;
  last_seen?: string;
  createdAt: string;
  updatedAt: string;
}
