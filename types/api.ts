export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// WebSocket event names
export type SocketEventName =
  | "new:message"
  | "conversation:status_changed"
  | "conversation:assigned"
  | "conversation:updated"
  | "conversation:resolved"
  | "conversation:transferred"
  | "agent:presence_updated"
  | "typing:start"
  | "typing:stop"
  | "knowledge:processing_update"
  | "bot:escalated"
  | "contact:updated";

export type ChannelType = "web_widget" | "whatsapp" | "telegram" | "api" | "facebook_messenger" | "instagram_dm";

export interface Channel {
  _id: string;
  workspace_id: string;
  name: string;
  type: ChannelType;
  config: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
