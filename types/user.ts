export interface User {
  _id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: "local" | "google" | "github";
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceRole = "owner" | "admin" | "agent" | "viewer";

export interface WorkspaceMembership {
  workspace: {
    _id: string;
    name: string;
    slug: string;
    branding: WorkspaceBranding;
  };
  role: WorkspaceRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  workspaces: WorkspaceMembership[];
  activeWorkspace: WorkspaceMembership | null;
}

export interface WorkspaceBranding {
  logo_url?: string;
  primary_color?: string;
  bot_name?: string;
}
