export interface BusinessHoursDay {
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "18:00"
}

export interface BusinessHours {
  monday: BusinessHoursDay;
  tuesday: BusinessHoursDay;
  wednesday: BusinessHoursDay;
  thursday: BusinessHoursDay;
  friday: BusinessHoursDay;
  saturday: BusinessHoursDay;
  sunday: BusinessHoursDay;
}

export interface WorkspaceSettings {
  language: string;
  timezone: string;
  business_hours: BusinessHours;
  auto_assign: boolean;
  bot_enabled: boolean;
  max_bot_turns: number;
  entry_bot_id?: string | null;
  csat_enabled: boolean;
}

export interface WorkspaceBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  text_color?: string;
  icon_color?: string;
  bot_name?: string;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  branding: WorkspaceBranding;
  settings: WorkspaceSettings;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  workspace_id: string;
  name: string;
  description: string;
  color: string;
  members_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  role: "owner" | "admin" | "agent" | "viewer";
  active: boolean;
  last_active_at?: string;
  department?: { _id: string; name: string; color: string } | null;
}
