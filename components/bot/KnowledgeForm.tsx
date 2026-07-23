"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2, RefreshCw, CheckCircle2, Clock, FlaskConical, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateKnowledgeItem,
  useUpdateKnowledgeItem,
  useDeleteKnowledgeItem,
  useReplaceKnowledgeFile,
  useDebugRagSearch,
} from "@/lib/hooks/useKnowledge";
import { KnowledgeTypeBadge } from "./KnowledgeItemBadge";
import { ProtocolStepsEditor } from "@/components/knowledge/ProtocolStepsEditor";
import type { KnowledgeItem, ProtocolStep } from "@/types/knowledge";

const schema = z.object({
  type: z.enum(["faq", "document", "flow", "snippet", "spreadsheet", "protocol"]),
  title: z.string().min(3, "Mínimo 3 caracteres"),
  content: z.string().optional(),
  confidence_threshold: z.coerce.number().min(0).max(1),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface KnowledgeFormProps {
  item: KnowledgeItem | null; // null = new
  onSaved: () => void;
  onDeleted: () => void;
}

export function KnowledgeForm({ item, onSaved, onDeleted }: KnowledgeFormProps) {
  const createItem  = useCreateKnowledgeItem();
  const updateItem  = useUpdateKnowledgeItem();
  const deleteItem  = useDeleteKnowledgeItem();
  const replaceFile = useReplaceKnowledgeFile();
  const replaceRef  = useRef<HTMLInputElement>(null);
  const [replacing, setReplacing] = useState(false);
  const [selectedType, setSelectedType] = useState<KnowledgeItem["type"]>(item?.type ?? "faq");
  const [protocolSteps, setProtocolSteps] = useState<ProtocolStep[]>(item?.protocol_steps ?? []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "faq",
      confidence_threshold: 0.75,
    },
  });

  const watchedType = watch("type");

  useEffect(() => {
    if (item) {
      reset({
        type: item.type,
        title: item.title,
        content: item.content ?? "",
        confidence_threshold: item.confidence_threshold,
        tags: item.tags?.join(", ") ?? "",
      });
      setSelectedType(item.type);
      setProtocolSteps(item.protocol_steps ?? []);
    } else {
      reset({ type: "faq", confidence_threshold: 0.75, title: "", content: "", tags: "" });
      setSelectedType("faq");
      setProtocolSteps([]);
    }
  }, [item, reset]);

  const onSubmit = async (values: FormValues) => {
    const tags = values.tags
      ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const isProtocol = values.type === "protocol";

    if (isProtocol && protocolSteps.length === 0) {
      toast.error("Un protocolo debe tener al menos un paso.");
      return;
    }

    if (item) {
      await updateItem.mutateAsync({
        itemId: item._id,
        title: values.title,
        content: isProtocol ? "" : (values.content ?? ""),
        confidence_threshold: values.confidence_threshold,
        tags,
        ...(isProtocol ? { protocol_steps: protocolSteps } : {}),
      });
    } else {
      await createItem.mutateAsync({
        type: values.type,
        title: values.title,
        content: isProtocol ? "" : (values.content ?? ""),
        confidence_threshold: values.confidence_threshold,
        tags,
        ...(isProtocol ? { protocol_steps: protocolSteps } : {}),
      });
    }
    onSaved();
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(`¿Eliminar "${item.title}"?\n\nSe borrará el documento y sus vectores de Qdrant.`)) return;
    await deleteItem.mutateAsync(item._id);
    onDeleted();
  };

  // Reemplazar archivo: llama al endpoint dedicado que actualiza contenido
  // y re-indexa en Qdrant automáticamente — sin ítems temporales
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !item) return;
    e.target.value = "";

    const allowed = ["txt", "md", "pdf", "docx"];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowed.includes(ext)) {
      toast.error("Formato no soportado. Usa TXT, MD, PDF o DOCX.");
      return;
    }

    setReplacing(true);
    try {
      const updated = await replaceFile.mutateAsync({ itemId: item._id, file });
      // Actualizar el textarea con el nuevo contenido
      setValue("content", updated.content);
      toast.success(`"${file.name}" cargado. Los vectores de Qdrant se actualizan en segundo plano.`);
      onSaved();
    } catch {
      toast.error("No se pudo reemplazar el archivo. Intenta de nuevo.");
    } finally {
      setReplacing(false);
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  // ─── Debug RAG ───────────────────────────────────────────────────────────────
  const [showDebug, setShowDebug] = useState(false);
  const [debugQuery, setDebugQuery] = useState("");
  const { run: runDebug, loading: debugLoading, result: debugResult } = useDebugRagSearch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            {item ? "Editar ítem" : "Nuevo ítem"}
          </h2>
          {/* Badge de estado RAG */}
          {item && (
            item.rag_indexed
              ? (
                <span
                  title={`Indexado en Qdrant · ${item.rag_chunks ?? 0} fragmentos`}
                  className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {item.rag_chunks ?? 0} chunks
                </span>
              ) : (
                <span
                  title="Pendiente de indexar en Qdrant"
                  className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                >
                  <Clock className="h-3 w-3" />
                  Sin indexar
                </span>
              )
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Botón reemplazar archivo (solo en documentos existentes) */}
          {item && item.type === "document" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Reemplazar archivo (PDF, DOCX, TXT, MD)"
                onClick={() => replaceRef.current?.click()}
                disabled={replacing || deleteItem.isPending}
              >
                {replacing
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />
                }
              </Button>
              <input
                ref={replaceRef}
                type="file"
                accept=".txt,.md,.pdf,.docx"
                className="hidden"
                onChange={handleReplaceFile}
              />
            </>
          )}
          {item && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteItem.isPending || replacing}
            >
              {deleteItem.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />
              }
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Type */}
        {!item && (
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              defaultValue="faq"
              onValueChange={(v) => {
                if (!v) return;
                setValue("type", v as KnowledgeItem["type"]);
                setSelectedType(v as KnowledgeItem["type"]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["faq", "document", "flow", "snippet", "protocol"] as const).map((t) => (
                  <SelectItem key={t} value={t}>
                    <KnowledgeTypeBadge type={t} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <Label>Título / Pregunta</Label>
          <Input placeholder="¿Cuáles son sus horarios de atención?" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        {/* Content — oculto si es protocolo */}
        {(item ? item.type !== "protocol" : (watchedType ?? selectedType) !== "protocol") && (
          <div className="space-y-1.5">
            <Label>Contenido / Respuesta</Label>
            <Textarea
              placeholder="Atendemos de lunes a viernes de 8:00 a 18:00 hs."
              className="min-h-[140px] resize-none text-sm"
              {...register("content")}
            />
            {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
          </div>
        )}

        {/* Protocol steps editor */}
        {(item ? item.type === "protocol" : (watchedType ?? selectedType) === "protocol") && (
          <div className="space-y-1.5">
            <Label>Pasos del protocolo</Label>
            <ProtocolStepsEditor
              steps={protocolSteps}
              onChange={setProtocolSteps}
            />
          </div>
        )}

        {/* Tags */}
        <div className="space-y-1.5">
          <Label>
            Etiquetas{" "}
            <span className="text-muted-foreground font-normal">(separadas por coma)</span>
          </Label>
          <Input placeholder="horarios, atencion, soporte" {...register("tags")} />
        </div>

        <Separator />

        {/* Confidence threshold */}
        <div className="space-y-1.5">
          <Label>
            Umbral de confianza{" "}
            <span className="text-muted-foreground font-normal">(0 – 1)</span>
          </Label>
          <Input
            type="number"
            step="0.05"
            min="0"
            max="1"
            {...register("confidence_threshold")}
          />
          <p className="text-xs text-muted-foreground">
            El bot usará este ítem solo cuando la similitud semántica supere este umbral.
          </p>
          {errors.confidence_threshold && (
            <p className="text-xs text-destructive">{errors.confidence_threshold.message}</p>
          )}
        </div>
      </div>

      {/* ── Panel de diagnóstico RAG (solo items existentes) ───────────────── */}
      {item && (
        <div className="px-5 py-3 border-t shrink-0 space-y-2">
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            {showDebug ? "Ocultar diagnóstico RAG" : "Probar búsqueda RAG"}
          </button>

          {showDebug && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-3 text-xs">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={debugQuery}
                  onChange={e => setDebugQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runDebug(debugQuery, item._id)}
                  placeholder="Escribe una pregunta del documento…"
                  className="flex-1 px-2.5 py-1.5 rounded border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={debugLoading || !debugQuery.trim()}
                  onClick={() => runDebug(debugQuery, item._id)}
                >
                  {debugLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Probar"}
                </Button>
              </div>

              {debugResult && (
                <div className="space-y-2">
                  {/* Paso 1: Embedding */}
                  <div className={`flex items-center gap-1.5 font-medium ${debugResult.step1_embedding?.ok ? "text-green-700" : "text-red-600"}`}>
                    {debugResult.step1_embedding?.ok
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : <XCircle className="h-3.5 w-3.5" />
                    }
                    {debugResult.step1_embedding?.ok
                      ? `✓ Embedding OK (${debugResult.step1_embedding.dimensions} dims)`
                      : "✗ Ollama no generó embedding — verifica OLLAMA_URL y el modelo"
                    }
                  </div>

                  {/* Paso 2: Qdrant sin filtro */}
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">
                      Qdrant (todos los docs) — {debugResult.step2_qdrant_raw?.length ?? 0} resultados
                    </p>
                    {debugResult.step2_qdrant_raw?.length === 0
                      ? <p className="text-amber-600">⚠ Qdrant no devolvió ningún resultado. El documento puede no estar indexado.</p>
                      : debugResult.step2_qdrant_raw?.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 py-0.5 border-b last:border-0">
                            <span className={`shrink-0 font-mono font-semibold ${r.score > 0.5 ? "text-green-700" : r.score > 0.2 ? "text-amber-600" : "text-muted-foreground"}`}>
                              {r.score.toFixed(4)}
                            </span>
                            <span className="text-muted-foreground truncate">{(r.text_preview ?? "").slice(0, 80)}</span>
                          </div>
                        ))
                    }
                  </div>

                  {/* Paso 3: Qdrant con filtro del item actual */}
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">
                      Qdrant (solo este doc) — {debugResult.step3_qdrant_filtered?.length ?? 0} resultados
                    </p>
                    {debugResult.step3_qdrant_filtered === null
                      ? <p className="text-muted-foreground italic">No aplicó filtro</p>
                      : debugResult.step3_qdrant_filtered.length === 0
                        ? <p className="text-red-600">✗ Sin resultados con filtro. El item_id en Qdrant puede no coincidir.</p>
                        : debugResult.step3_qdrant_filtered.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 py-0.5 border-b last:border-0">
                              <span className={`shrink-0 font-mono font-semibold ${r.score > 0.5 ? "text-green-700" : r.score > 0.2 ? "text-amber-600" : "text-muted-foreground"}`}>
                                {r.score.toFixed(4)}
                              </span>
                              <span className="text-muted-foreground truncate">{(r.text_preview ?? "").slice(0, 80)}</span>
                            </div>
                          ))
                    }
                  </div>

                  {/* Paso 4: searchRelevant final */}
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">
                      Resultado final del bot — {debugResult.step4_knowledge_search?.length ?? 0} items
                    </p>
                    {debugResult.step4_knowledge_search?.length === 0
                      ? <p className="text-red-600">✗ El bot no recibirá contexto del documento. Esta es la causa del problema.</p>
                      : debugResult.step4_knowledge_search?.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 py-0.5">
                            <span className="shrink-0 font-mono text-green-700 font-semibold">{r.score.toFixed(4)}</span>
                            <span className="text-muted-foreground truncate">{(r.content_prev ?? "").slice(0, 80)}</span>
                          </div>
                        ))
                    }
                  </div>

                  {debugResult.error && (
                    <p className="text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                      Error: {debugResult.error}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="px-5 py-3 border-t shrink-0">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {item ? "Guardar cambios" : "Crear ítem"}
        </Button>
      </div>
    </form>
  );
}
