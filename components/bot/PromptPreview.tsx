"use client";

import { useState } from "react";
import { Loader2, Eye, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/stores/auth.store";
import api from "@/lib/api";

interface PreviewResponse {
  section_identity: string;
  section_context: string | null;
  section_rules: string;
  full_prompt: string;
  knowledge_titles: string[];
}

interface PromptPreviewProps {
  botId: string;
}

export function PromptPreview({ botId }: PromptPreviewProps) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const [sampleMessage, setSampleMessage] = useState("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!workspaceId || !sampleMessage.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post<PreviewResponse>(
        `/api/${workspaceId}/bots/${botId}/preview-prompt`,
        { sample_message: sampleMessage.trim() }
      );
      setPreview(res.data);
    } catch {
      setError("No se pudo obtener la vista previa. Verifica que el bot esté guardado e intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Vista previa del prompt</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Simula cómo se construye el prompt completo que recibirá el agente ante un mensaje real.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={sampleMessage}
          onChange={(e) => setSampleMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handlePreview(); }}
          placeholder="Escribe un mensaje de prueba…"
          className="flex-1 text-sm"
          disabled={isLoading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={isLoading || !sampleMessage.trim()}
        >
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            : <Eye className="h-4 w-4 mr-1.5" />}
          Previsualizar
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
      )}

      {preview && (
        <div className="space-y-3">
          {/* Sección 1 — Identidad / system prompt */}
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-green-800 dark:text-green-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
              Sección 1 — Tu prompt de sistema
            </p>
            <pre className="text-xs text-green-900 dark:text-green-200 whitespace-pre-wrap font-mono leading-relaxed">
              {preview.section_identity}
            </pre>
          </div>

          {/* Sección 2 — Conocimiento (solo si hay contexto) */}
          {preview.section_context !== null && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" />
                Sección 2 — Conocimiento encontrado
              </p>
              {preview.knowledge_titles.length > 0 && (
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  <span className="font-medium">Fragmentos:</span>{" "}
                  {preview.knowledge_titles.join(", ")}
                </p>
              )}
              <pre className="text-xs text-yellow-900 dark:text-yellow-200 whitespace-pre-wrap font-mono leading-relaxed">
                {preview.section_context}
              </pre>
            </div>
          )}

          {/* Sección 3 — Reglas del sistema */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900/40 dark:border-gray-700 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-500 inline-block" />
              Sección 3 — Reglas del sistema <span className="font-normal text-muted-foreground">(no editable)</span>
            </p>
            <pre className="text-xs text-gray-800 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {preview.section_rules}
            </pre>
          </div>

          {/* Nota informativa */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 border px-3 py-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Las reglas del sistema garantizan que el agente no invente información y sepa cuándo escalar.
              No son editables pero son transparentes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
