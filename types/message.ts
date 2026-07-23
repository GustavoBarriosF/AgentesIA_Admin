export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "file"
  | "location"
  | "template"
  | "system";

export type SenderType = "contact" | "agent" | "bot" | "system";

export interface AIMeta {
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  confidence?: number;
  knowledge_item_ids?: string[];
  escalation_reason?: string;
}

export interface ChannelMeta {
  // SMS
  sms_segments?: number;
  sms_cost?: number;
  sms_provider?: "twilio" | "vonage" | "sns";
  // LINE
  line_message_type?: string;
  [key: string]: unknown;
}

export interface Attachment {
  _id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  url: string;
}

export interface Message {
  _id: string;
  workspace_id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_id?: string;
  type: MessageType;
  content?: string;
  attachments?: Attachment[];
  read_at?: string;
  ai_meta?: AIMeta;
  channel_meta?: ChannelMeta;
  // Optimistic update state
  _pending?: boolean;
  _error?: boolean;
  createdAt: string;
  updatedAt: string;
}
