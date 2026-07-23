export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface TicketNote {
  content: string;
  author_id: string;
  createdAt: string;
}

/** @deprecated use TicketNote */
export type InternalNote = TicketNote;

export interface Ticket {
  _id: string;
  workspace_id: string;
  // Backend populates contact_id → the field keeps its name but is an object
  contact_id: {
    _id: string;
    name?: string;
    email?: string;
  };
  conversation_id?: string;
  // Backend populates assigned_to → agent doc with nested user_id
  assigned_to?: {
    _id: string;
    user_id?: {
      name: string;
      avatar_url?: string;
    };
  };
  department_id?: {
    _id: string;
    name: string;
    color: string;
  } | null;
  title: string;
  description?: string;
  priority: TicketPriority;
  status: TicketStatus;
  sla_breach: boolean;
  sla_due_at?: string;
  resolved_at?: string;
  internal_notes: TicketNote[];
  public_notes: TicketNote[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string;
  department_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateTicketInput {
  title: string;
  description?: string;
  contact_id: string;
  conversation_id?: string;
  priority?: TicketPriority;
  tags?: string[];
  department_id?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string | null;
  tags?: string[];
  department_id?: string | null;
}
