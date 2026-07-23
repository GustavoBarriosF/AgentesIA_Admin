export type BotAgentType = "decision_bot" | "ai_agent";

export type ActionType =
  | "next_step"
  | "goto_step"
  | "route_bot"
  | "route_agent"
  | "escalate_human"
  | "end"
  | "collect_name"
  | "collect_email"
  | "collect_phone"
  | "create_ticket"
  | "collect_text";

export interface StepAction {
  type: ActionType;
  goto_step_index?: number | null;
  target_bot_id?: string | null;
  target_agent_id?: string | null;
  end_message?: string | null;
  collect_message?: string | null;
  collect_error_message?: string | null;
  /** Solo para collect_*: paso al que ir después de recolectar el dato (null = siguiente paso automático) */
  collect_next_step_index?: number | null;
  /** Solo para collect_text: clave con la que se guarda la respuesta */
  collect_key?: string | null;
  /** Solo para escalate_human: asignar al miembro con este user._id */
  assigned_member_id?: string | null;
  /** Solo para escalate_human: asignar a este departamento */
  assigned_department_id?: string | null;
  /** Solo para create_ticket: configuración del ticket generado */
  ticket_config?: {
    priority?: "low" | "medium" | "high" | "urgent";
    success_message?: string;
    /** Agente asignado al ticket */
    assigned_member_id?: string | null;
    /** Departamento asignado al ticket */
    assigned_department_id?: string | null;
    /** Qué hacer después de crear el ticket */
    post_action?: "end" | "next_step" | "goto_step" | "escalate_human" | null;
    post_goto_step_index?: number | null;
    post_escalate_member_id?: string | null;
    post_escalate_department_id?: string | null;
  } | null;
}

export interface StepOption {
  label: string;
  action: StepAction;
}

export interface BotStep {
  _id?: string;
  message: string;
  options: StepOption[];
  /** Acción automática — se ejecuta sin esperar input del usuario (solo cuando options está vacío) */
  action?: StepAction | null;
}

export type AIProvider = "claude" | "openai" | "gemini" | "groq" | "ollama";

export type ClaudeModel =
  | "claude-haiku-4-5-20251001"
  | "claude-sonnet-4-6"
  | "claude-opus-4-6";

export interface BotAgent {
  _id: string;
  workspace_id: string;
  name: string;
  avatar?: string | null;
  type: BotAgentType;
  active: boolean;
  // Decision bot
  steps: BotStep[];
  // AI Agent
  system_prompt: string;
  knowledge_item_ids: string[];
  /** null = hereda proveedor del workspace */
  provider?: AIProvider | null;
  /** null = hereda modelo del workspace */
  model?: string | null;
  max_turns: number;
  rag_top_k: number;
  escalate_on_low_confidence: boolean;
  default_department_id?: string | null;
  /** ID del KnowledgeItem de tipo protocol asociado al agente */
  protocol_id?: string | null;
  // Recopilación de datos del contacto
  collect_name: boolean;
  collect_phone: boolean;
  collect_email: boolean;
  collect_identification: boolean;
  createdAt: string;
  updatedAt: string;
}
