export type LeadStage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export interface LeadContact {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface LeadNote {
  _id?: string;
  content: string;
  author_id: string;
  createdAt: string;
}

export interface Lead {
  _id: string;
  workspace_id: string;
  contact_id: LeadContact;
  conversation_id?: string | null;
  assigned_to?: string | null;
  stage: LeadStage;
  value?: number | null;
  currency: string;
  lost_reason?: string | null;
  notes: LeadNote[];
  custom_fields: Record<string, unknown>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}
