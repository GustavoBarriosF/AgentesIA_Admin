"use client";

import { useRef, useState, useEffect } from "react";
import {
  Upload, Loader2, FileText, Trash2, RefreshCw,
  CheckCircle2, Clock, AlertTriangle, Zap,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useKnowledge,
  useUploadKnowledgeFile,
  useDeleteKnowledgeItem,
  useReplaceKnowledgeFile,
  useReindexItem,
  useRAGDiagnosis,
} from "@/lib/hooks/useKnowledge";
import { useAvailableModels } from "@/lib/hooks/useAIProviders";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { KnowledgeTypeBadge } from "./KnowledgeItemBadge";
import type { BotAgent, AIProvider } from "@/types/bot";
import type { KnowledgeItem } from "@/types/knowledge";

interface AiAgentEditorProps {
  data: Pick<BotAgent,
    "system_prompt" | "knowledge_item_ids" | "provider" | "model" |
    "max_turns" | "rag_top_k" | "escalate_on_low_confidence" | "default_department_id"
  >;
  onChange: (patch: Partial<AiAgentEditorProps["data"]>) => void;
}

export function AiAgentEditor({ data, onChange }: AiAgentEditorProps) {
  const { data: knowledgeItems = [], isLoading: loadingKnowledge } = useKnowledge();
  const { data: availableModels, isLoading: loadingModels }        = useAvailableModels();
  const { data: diagnosis }                                         = useRAGDiagnosis();
  const uploadFile  = useUploadKnowledgeFile();
  const deleteItem  = useDeleteKnowledgeItem();
  const replaceFile = useReplaceKnowledgeFile();
  const reindexItem = useReindexItem();
  const { data: departments = [] } = useDepartments();

  const uploadRef  = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replacingId,   setReplacingId]   = useState<string | null>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);

  // ── Limpiar IDs huérfanos automáticamente ──────────────────────────────────
  // Cuando los items cargan, elimina del estado cualquier ID que ya no exista
  // (ej: documentos eliminados que el bot aún referenciaba)
  useEffect(() => {
    if (loadingKnowledge) return;
    const validIds = new Set(knowledgeItems.map((i) => i._id));
    const current  = data.knowledge_item_ids ?? [];
    const cleaned  = current.filter((id) => validIds.has(id));
    if (cleaned.length !== current.length) {
      onChange({ knowledge_item_ids: cleaned });
    }
  // Solo ejecutar cuando termina de cargar, no en cada render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingKnowledge]);

  /* ── helpers ── */

  const toggleKnowledge = (id: string) => {
    const ids  = data.knowledge_item_ids ?? [];
    const next = ids.includes(id) ? ids.filter((k) => k !== id) : [...ids, id];
    onChange({ knowledge_item_ids: next });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const allowed = ["txt", "md", "pdf", "docx", "xlsx", "xls"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowed.includes(ext)) {
      toast.error("Formato no soportado. Usa TXT, MD, PDF, DOCX, XLSX o XLS.");
      return;
    }

    setUploadingName(file.name);
    try {
      const item = await uploadFile.mutateAsync({ file });
      const ids  = data.knowledge_item_ids ?? [];
      if (!ids.includes(item._id)) onChange({ knowledge_item_ids: [...ids, item._id] });
      toast.success(`"${item.title}" cargado y seleccionado`);
    } catch {
      toast.error("No se pudo cargar el archivo");
    } finally {
      setUploadingName(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, item: KnowledgeItem) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar "${item.title}"?\nSe borrará el documento y sus vectores de Qdrant.`)) return;
    try {
      await deleteItem.mutateAsync(item._id);
      // Deseleccionar si estaba seleccionado
      const ids = data.knowledge_item_ids ?? [];
      if (ids.includes(item._id)) onChange({ knowledge_item_ids: ids.filter((k) => k !== item._id) });
      toast.success(`"${item.title}" eliminado`);
    } catch {
      toast.error("No se pudo eliminar el documento");
    }
  };

  const handleReplaceClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    setReplacingId(itemId);
    replaceRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;
    e.target.value = "";

    const allowed = ["txt", "md", "pdf", "docx", "xlsx", "xls"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowed.includes(ext)) {
      toast.error("Formato no soportado. Usa TXT, MD, PDF, DOCX, XLSX o XLS.");
      setReplacingId(null);
      return;
    }

    try {
      await replaceFile.mutateAsync({ itemId: replacingId, file });
      toast.success(`Archivo reemplazado. Re-indexando en Qdrant…`);
    } catch {
      toast.error("No se pudo reemplazar el archivo");
    } finally {
      setReplacingId(null);
    }
  };

  /* ── modelos disponibles ── */

  const selectedProvider  = data.provider ?? null;
  const claudeModels      = availableModels?.claude ?? [];
  const openaiModels      = availableModels?.openai ?? [];
  const geminiModels      = availableModels?.gemini ?? [];
  const groqModels        = availableModels?.groq   ?? [];
  const ollamaModels      = availableModels?.ollama ?? [];
  const ollamaAvailable   = availableModels?.ollama_available ?? false;

  const modelList =
    selectedProvider === "claude"  ? claudeModels  :
    selectedProvider === "openai"  ? openaiModels  :
    selectedProvider === "gemini"  ? geminiModels  :
    selectedProvider === "groq"    ? groqModels    :
    selectedProvider === "ollama"  ? ollamaModels  :
    [...claudeModels, ...openaiModels, ...geminiModels, ...groqModels, ...ollamaModels];

  /* ── render ── */

  return (
    <div className="space-y-5">

      {/* System prompt */}
      <div className="space-y-1.5">
        <Label>Prompt del sistema</Label>
        <p className="text-xs text-muted-foreground">
          Define la personalidad, tono y comportamiento del agente.
          Usa {"{{workspace_name}}"} para el nombre del workspace.
        </p>
        <Textarea
          className="min-h-[140px] resize-none text-sm font-mono"
          placeholder={`Eres un asistente virtual amable de {{workspace_name}}.\nResponde siempre en español, de manera clara y concisa.\nSi no puedes resolver la consulta, escala al equipo de soporte.`}
          value={data.system_prompt ?? ""}
          onChange={(e) => onChange({ system_prompt: e.target.value })}
        />
      </div>

      <Separator />

      {/* ── Base de conocimiento ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            Base de conocimiento{" "}
            <span className="text-muted-foreground font-normal text-xs">
              ({(data.knowledge_item_ids ?? []).filter(
                (id) => knowledgeItems.some((item) => item._id === id)
              ).length} seleccionados)
            </span>
          </Label>
          <button
            type="button"
            onClick={() => uploadRef.current?.click()}
            disabled={uploadFile.isPending}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadFile.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Upload className="h-3.5 w-3.5" />}
            {uploadFile.isPending ? `Cargando ${uploadingName}…` : "Subir archivo"}
          </button>

          {/* inputs ocultos */}
          <input ref={uploadRef}  type="file" accept=".txt,.md,.pdf,.docx,.xlsx,.xls" className="hidden" onChange={handleUpload} />
          <input ref={replaceRef} type="file" accept=".txt,.md,.pdf,.docx,.xlsx,.xls" className="hidden" onChange={handleReplaceFile} />
        </div>

        <p className="text-xs text-muted-foreground">
          Sube un PDF, DOCX, TXT, MD o un libro Excel (XLSX/XLS). El contenido se fragmenta
          e indexa automáticamente en Qdrant para búsqueda semántica (RAG).
        </p>

        {/* Banner de diagnóstico cuando hay problema con RAG */}
        {diagnosis && (!diagnosis.ollama_reachable || !diagnosis.embed_works) && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Indexación semántica no disponible</p>
              <p>
                Ollama ({diagnosis.ollama_url}) se usa solo para generar <em>embeddings</em> (vectores
                de búsqueda), <strong>no para las respuestas del bot</strong>. Las respuestas del agente
                siguen funcionando con normalidad usando el proveedor de IA configurado.
              </p>
              <p className="text-amber-700">
                {diagnosis.embed_works === false && diagnosis.ollama_reachable
                  ? `El modelo de embeddings "${diagnosis.embed_model}" no está disponible en Ollama. Descárgalo con: ollama pull ${diagnosis.embed_model}`
                  : `Ollama no es accesible en ${diagnosis.ollama_url}. Los documentos se incluirán completos en el contexto del bot sin búsqueda semántica.`
                }
              </p>
            </div>
          </div>
        )}

        {loadingKnowledge ? (
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
          </div>
        ) : knowledgeItems.length === 0 ? (
          <div
            onClick={() => uploadRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-md p-5 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Sube tu primer documento</p>
            <p className="text-xs text-muted-foreground text-center">
              PDF, DOCX, TXT, MD o Excel (XLSX/XLS) · El agente aprenderá de su contenido
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-52 overflow-y-auto rounded-md border p-1.5">
            {knowledgeItems.map((item) => {
              const selected    = data.knowledge_item_ids?.includes(item._id);
              const isReplacing = replacingId === item._id && replaceFile.isPending;
              const isDeleting  = deleteItem.isPending;

              return (
                <div
                  key={item._id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-sm group ${
                    selected ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  {/* Checkbox de selección */}
                  <button
                    type="button"
                    onClick={() => toggleKnowledge(item._id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${
                      selected ? "bg-primary border-primary" : "border-muted-foreground/40"
                    }`}>
                      {selected && <span className="text-primary-foreground text-[8px] font-bold">✓</span>}
                    </div>

                    {/* Título */}
                    <span className={`flex-1 truncate ${selected ? "text-primary font-medium" : ""}`}>
                      {item.title}
                    </span>
                  </button>

                  {/* Badges e indicadores */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Estado RAG */}
                    {item.rag_indexed ? (
                      <span title={`Indexado en Qdrant · ${item.rag_chunks ?? 0} chunks`}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      </span>
                    ) : (
                      <span title="Pendiente de indexar">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                      </span>
                    )}
                    <KnowledgeTypeBadge type={item.type} />
                  </div>

                  {/* Acciones — visibles al hacer hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {/* Re-indexar en Qdrant */}
                    <button
                      type="button"
                      title={item.rag_indexed ? "Re-indexar en Qdrant" : "Indexar en Qdrant (pendiente)"}
                      disabled={reindexItem.isPending || isDeleting}
                      onClick={(e) => {
                        e.stopPropagation();
                        reindexItem.mutate(item._id);
                      }}
                      className={`p-1 rounded hover:bg-muted-foreground/10 disabled:opacity-40 ${
                        !item.rag_indexed
                          ? "text-amber-500 hover:text-amber-600"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {reindexItem.isPending && reindexItem.variables === item._id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Zap className="h-3.5 w-3.5" />}
                    </button>

                    {/* Reemplazar archivo (solo documentos) */}
                    {item.type === "document" && (
                      <button
                        type="button"
                        title="Reemplazar archivo"
                        disabled={isReplacing || isDeleting}
                        onClick={(e) => handleReplaceClick(e, item._id)}
                        className="p-1 rounded hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground disabled:opacity-40"
                      >
                        {isReplacing
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />}
                      </button>
                    )}

                    {/* Eliminar */}
                    <button
                      type="button"
                      title="Eliminar documento"
                      disabled={isDeleting || isReplacing}
                      onClick={(e) => handleDelete(e, item)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-40"
                    >
                      {isDeleting
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Proveedor + Modelo ── */}
      <div className="space-y-3">
        <div>
          <Label>Proveedor de IA</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deja en "Heredar" para usar el proveedor configurado en Ajustes del workspace.
          </p>
        </div>

        {/* Provider tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: null,      label: "Heredar workspace", icon: null },
            { id: "claude",  label: "Claude",            icon: "✦"  },
            { id: "openai",  label: "OpenAI",            icon: "⬡"  },
            { id: "gemini",  label: "Gemini",            icon: "✳"  },
            { id: "groq",    label: "Groq",              icon: "▲"  },
            { id: "ollama",  label: "Ollama",            icon: "⚡"  },
          ].map((p) => (
            <button
              key={String(p.id)}
              type="button"
              onClick={() => onChange({ provider: p.id as AIProvider | null, model: null })}
              disabled={p.id === "ollama" && !ollamaAvailable}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                selectedProvider === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground/50 text-muted-foreground"
              }`}
            >
              {p.icon && <span>{p.icon}</span>}
              {p.label}
            </button>
          ))}
        </div>

        {/* Model selector */}
        <div className="space-y-1.5">
          <Label className="text-sm">Modelo</Label>
          {loadingModels ? (
            <Skeleton className="h-9 w-full" />
          ) : modelList.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {selectedProvider === "ollama" && !ollamaAvailable
                ? "Ollama no disponible. Verifica la conexión."
                : "Sin modelos disponibles"}
            </p>
          ) : (
            <Select
              value={data.model ?? ""}
              onValueChange={(v) => onChange({ model: v || null })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedProvider === null ? "Modelo del workspace (default)" : "Selecciona un modelo"} />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider === null && (
                  <SelectItem value="">
                    <span className="text-muted-foreground">Modelo del workspace (default)</span>
                  </SelectItem>
                )}
                {modelList.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {m.provider === "ollama" ? "⚡" : m.provider === "openai" ? "⬡" : m.provider === "gemini" ? "✳" : m.provider === "groq" ? "▲" : "✦"}
                        </span>
                        <span className="font-medium">{m.name}</span>
                      </div>
                      {m.description && (
                        <span className="text-xs text-muted-foreground">{m.description}</span>
                      )}
                      {m.size && (
                        <span className="text-xs text-muted-foreground">
                          {(m.size / 1e9).toFixed(1)} GB
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Separator />

      {/* Departamento por defecto para tickets */}
      <div className="space-y-1.5">
        <Label>Departamento por defecto</Label>
        <p className="text-xs text-muted-foreground">
          Se usa cuando el proceso no especifica un departamento: al escalar la conversación a un agente humano o al crear un ticket automático.
        </p>
        <Select
          value={data.default_department_id || "none"}
          onValueChange={(v) => onChange({ default_department_id: v === "none" ? null : v })}
        >
          <SelectTrigger className="w-full">
            {(() => {
              const dept = departments.find((d) => d._id === data.default_department_id);
              return dept ? (
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0 inline-block"
                    style={{ backgroundColor: dept.color ?? "#6366f1" }}
                  />
                  {dept.name}
                </span>
              ) : (
                <span className="text-muted-foreground">Sin departamento por defecto</span>
              );
            })()}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin departamento por defecto</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept._id} value={dept._id}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0 inline-block"
                    style={{ backgroundColor: dept.color ?? "#6366f1" }}
                  />
                  {dept.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Max turns */}
      <div className="space-y-1.5">
        <Label>Máximo de turnos</Label>
        <Input
          type="number"
          min="1"
          max="20"
          value={data.max_turns ?? 8}
          onChange={(e) => onChange({ max_turns: Number(e.target.value) })}
        />
        <p className="text-xs text-muted-foreground">
          Si se supera este límite sin resolución, el agente escala a un humano.
        </p>
      </div>

      {/* RAG top K */}
      <div className="space-y-1.5">
        <Label>Fragmentos de base de conocimiento</Label>
        <Input
          type="number"
          min="1"
          max="30"
          value={data.rag_top_k ?? 12}
          onChange={(e) => onChange({ rag_top_k: Number(e.target.value) })}
        />
        <p className="text-xs text-muted-foreground">
          Cantidad de fragmentos del documento que el agente recibe por turno. Procedimientos con más pasos o ramas requieren un valor mayor (recomendado: 8–20).
        </p>
      </div>

      {/* Escalate on low confidence */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Escalar si baja la confianza</p>
          <p className="text-xs text-muted-foreground">
            Si el agente no encuentra respuesta adecuada, pasa a un agente humano.
          </p>
        </div>
        <Switch
          checked={data.escalate_on_low_confidence ?? true}
          onCheckedChange={(v) => onChange({ escalate_on_low_confidence: v })}
        />
      </div>
    </div>
  );
}
