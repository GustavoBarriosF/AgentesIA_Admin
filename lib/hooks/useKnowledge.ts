import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";
import type { KnowledgeItem, ProtocolStep } from "@/types/knowledge";

// Base key — invalidar esto invalida todas las sub-queries de knowledge
const QK = (wid: string) => ["knowledge", wid];

// ─── List items ──────────────────────────────────────────────────────────────

/** Solo ítems activos (para el editor de agentes y selección) */
export function useKnowledge() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery({
    queryKey: [...QK(workspaceId ?? ""), "active"],
    queryFn: async () => {
      const res = await api.get<KnowledgeItem[]>(`/api/${workspaceId}/knowledge`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

/** Todos los ítems incluyendo inactivos (para el panel de gestión "Base de conocimiento") */
export function useKnowledgeAll() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery({
    queryKey: [...QK(workspaceId ?? ""), "all"],
    queryFn: async () => {
      const res = await api.get<KnowledgeItem[]>(
        `/api/${workspaceId}/knowledge`,
        { params: { include_inactive: true } }
      );
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

// ─── Search (test bot) ────────────────────────────────────────────────────────

export function useKnowledgeSearch(q: string) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery({
    queryKey: ["knowledge", "search", workspaceId, q],
    queryFn: async () => {
      const res = await api.get<KnowledgeItem[]>(
        `/api/${workspaceId}/knowledge/search`,
        { params: { q } }
      );
      return res.data;
    },
    enabled: !!workspaceId && q.trim().length > 2,
    staleTime: 10_000,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreateKnowledgeItem() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async (body: {
      type: KnowledgeItem["type"];
      title: string;
      content: string;
      confidence_threshold?: number;
      tags?: string[];
      protocol_steps?: ProtocolStep[];
    }) => {
      const res = await api.post<KnowledgeItem>(
        `/api/${workspaceId}/knowledge`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdateKnowledgeItem() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({
      itemId,
      ...body
    }: {
      itemId: string;
      title?: string;
      content?: string;
      confidence_threshold?: number;
      active?: boolean;
      tags?: string[];
      protocol_steps?: ProtocolStep[];
    }) => {
      const res = await api.patch<KnowledgeItem>(
        `/api/${workspaceId}/knowledge/${itemId}`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
    },
  });
}

// ─── Upload file ─────────────────────────────────────────────────────────────

export function useUploadKnowledgeFile() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title?: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);
      const res = await api.post<KnowledgeItem>(
        `/api/${workspaceId}/knowledge/upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
    },
  });
}

// ─── Diagnóstico RAG ──────────────────────────────────────────────────────────

export interface RAGDiagnosis {
  ollama_reachable: boolean;
  qdrant_reachable: boolean;
  embed_model: string;
  embed_works: boolean;
  embed_dimensions: number;
  ollama_url: string;
  qdrant_url: string;
  error: string | null;
}

export function useRAGDiagnosis() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery<RAGDiagnosis>({
    queryKey: ["rag-diagnosis", workspaceId],
    queryFn: async () => {
      const res = await api.get<RAGDiagnosis>(`/api/${workspaceId}/knowledge/diagnose`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
    retry: false,
  });
}

// ─── Re-indexar item ──────────────────────────────────────────────────────────

export function useReindexItem() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await api.post<{ chunks: number; skipped: number; ok: boolean }>(
        `/api/${workspaceId}/knowledge/${itemId}/reindex`
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
      if (data.ok) {
        toast.success(`Re-indexado correctamente (${data.chunks} fragmentos)`);
      } else {
        toast.error(`No se generaron embeddings. Verifica la conexión con Ollama.`);
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al re-indexar";
      toast.error(msg);
    },
  });
}

// ─── Replace file ─────────────────────────────────────────────────────────────

export function useReplaceKnowledgeFile() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post<KnowledgeItem>(
        `/api/${workspaceId}/knowledge/${itemId}/replace`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
    },
  });
}

// ─── Debug RAG search ─────────────────────────────────────────────────────────

export interface RAGDebugResult {
  query: string
  step1_embedding:  { ok: boolean; dimensions: number; preview: number[] } | null
  step2_qdrant_raw: { score: number; knowledge_item_id: string; text_preview: string }[]
  step3_qdrant_filtered: { score: number; knowledge_item_id: string; text_preview: string }[] | null
  step4_knowledge_search: { score: number; item_id: string; title: string; content_prev: string }[]
  error: string | null
}

export function useDebugRagSearch() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<RAGDebugResult | null>(null);

  const run = async (q: string, itemId?: string) => {
    if (!workspaceId || !q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const params: Record<string, string> = { q };
      if (itemId) params.item_id = itemId;
      const res = await api.get<RAGDebugResult>(
        `/api/${workspaceId}/knowledge/debug-search`,
        { params }
      );
      setResult(res.data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error ?? "Error en debug search");
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, result };
}

// ─── List protocols ───────────────────────────────────────────────────────────

/** Retorna solo los KnowledgeItems de tipo protocol */
export function useProtocols() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  return useQuery({
    queryKey: [...QK(workspaceId ?? ""), "protocols"],
    queryFn: async () => {
      const res = await api.get<KnowledgeItem[]>(
        `/api/${workspaceId}/knowledge`,
        { params: { type: "protocol" } }
      );
      // El endpoint actual no filtra por type en el query, filtramos en cliente
      return res.data.filter((k) => k.type === "protocol");
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────

export function useDeleteKnowledgeItem() {
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/api/${workspaceId}/knowledge/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK(workspaceId ?? "") });
    },
  });
}
