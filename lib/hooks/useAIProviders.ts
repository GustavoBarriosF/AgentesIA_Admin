import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIProviderType = "claude" | "openai" | "gemini" | "groq" | "ollama";

export interface AIProviderConfig {
  _id?: string;
  workspace_id?: string;
  provider: AIProviderType;
  model: string;
  embed_model?: string;
  ollama_url?: string | null;
  /** true si hay una API key guardada en el servidor (la clave real nunca se devuelve) */
  api_key_configured?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: AIProviderType | string;
  description?: string;
  size?: number;
  modified_at?: string;
}

export interface AvailableModels {
  claude: ModelInfo[];
  openai: ModelInfo[];
  gemini: ModelInfo[];
  groq:   ModelInfo[];
  ollama: ModelInfo[];
  ollama_available: boolean;
  qdrant_available: boolean;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAIProvider() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<AIProviderConfig>({
    queryKey: ["ai-provider", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/ai-providers`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useAvailableModels() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useQuery<AvailableModels>({
    queryKey: ["ai-models", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/api/${workspaceId}/ai-providers/models`);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 120_000,
  });
}

export function useUpdateAIProvider() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      provider: AIProviderType;
      model: string;
      /** API key del proveedor. Omitir para no cambiar la existente. Enviar "" para borrarla. */
      api_key?: string;
      /** URL del servidor Ollama (solo para provider=ollama) */
      ollama_url?: string;
      embed_model?: string;
    }) => {
      const res = await api.put<AIProviderConfig>(
        `/api/${workspaceId}/ai-providers`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success("Proveedor de IA actualizado correctamente");
      qc.invalidateQueries({ queryKey: ["ai-provider", workspaceId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Error al actualizar proveedor de IA";
      toast.error(msg);
    },
  });
}

export function useReindexKnowledge() {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  return useMutation({
    mutationFn: async () => {
      const res = await api.post(`/api/${workspaceId}/ai-providers/reindex`);
      return res.data;
    },
    onSuccess: () => {
      toast.success(
        "Re-indexación iniciada. Esto puede tomar varios minutos dependiendo del tamaño de tu base de conocimiento."
      );
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Error al iniciar re-indexación";
      toast.error(msg);
    },
  });
}
