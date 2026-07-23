export type KnowledgeItemType = "faq" | "document" | "flow" | "snippet" | "spreadsheet" | "protocol";

export interface ProtocolStep {
  step_number: number;
  title: string;
  instructions: string;
  completion_signal: string | null;
  requires_data: "name" | "email" | "phone" | "identification" | null;
  max_turns_in_step: number;
}

export interface KnowledgeItemStats {
  usage_count: number;
  helpful_count: number;
  unhelpful_count: number;
}

export interface KnowledgeItem {
  _id: string;
  workspace_id: string;
  type: KnowledgeItemType;
  title: string;
  content: string;
  confidence_threshold: number;
  active: boolean;
  tags: string[];
  usage_count: number;
  helpful_count: number;
  unhelpful_count: number;
  /** true cuando el item está indexado en Qdrant para RAG */
  rag_indexed?: boolean;
  /** número de fragmentos vectoriales en Qdrant */
  rag_chunks?: number;
  /** última vez que fue indexado */
  rag_indexed_at?: string | null;
  /** Pasos del protocolo (solo para type === "protocol") */
  protocol_steps?: ProtocolStep[];
  similarity_score?: number;
  createdAt: string;
  updatedAt: string;
}
