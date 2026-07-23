"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { BotAvatarUpload } from "./BotAvatarUpload";
import { DecisionBotEditor } from "./DecisionBotEditor";
import { AiAgentEditor } from "./AiAgentEditor";
import { PromptPreview } from "./PromptPreview";
import { useUpdateBot, useDeleteBot } from "@/lib/hooks/useBots";
import { useWorkspaceMembers } from "@/lib/hooks/useWorkspace";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useProtocols } from "@/lib/hooks/useKnowledge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { BotAgent } from "@/types/bot";

interface BotEditorPanelProps {
  bot: BotAgent;
  allBots: BotAgent[];
  onClose: () => void;
}

function withDefaults(bot: BotAgent): BotAgent {
  return {
    ...bot,
    collect_name:           bot.collect_name           ?? false,
    collect_phone:          bot.collect_phone          ?? false,
    collect_email:          bot.collect_email          ?? false,
    collect_identification: bot.collect_identification ?? false,
  }
}

export function BotEditorPanel({ bot, allBots, onClose }: BotEditorPanelProps) {
  const [draft, setDraft] = useState<BotAgent>(withDefaults(bot));
  const [saved, setSaved] = useState(false);
  const updateBot = useUpdateBot();
  const deleteBot = useDeleteBot();
  const { data: members = [] }     = useWorkspaceMembers();
  const { data: departments = [] } = useDepartments();
  const { data: protocols = [] }   = useProtocols();

  useEffect(() => {
    setDraft(withDefaults(bot));
    setSaved(false);
  }, [bot._id]);

  const patch = (p: Partial<BotAgent>) => { setDraft((d) => ({ ...d, ...p })); setSaved(false); };

  const handleSave = async () => {
    // Validar departamento por defecto para agentes de IA
    if (draft.type === "ai_agent" && !draft.default_department_id) {
      toast.error("Debes seleccionar un departamento por defecto para el agente de IA.");
      return;
    }

    try {
      await updateBot.mutateAsync({ botId: draft._id, ...draft });
      setSaved(true);
      toast.success(`"${draft.name}" guardado correctamente`);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error("No se pudo guardar. Intenta de nuevo.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${draft.name}"? Esta acción no se puede deshacer.`)) return;
    await deleteBot.mutateAsync(draft._id);
    onClose();
  };

  const otherBots  = allBots.filter((b) => b.type === "decision_bot" && b._id !== bot._id);
  const otherAgents = allBots.filter((b) => b.type === "ai_agent" && b._id !== bot._id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            draft.type === "decision_bot"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
          }`}>
            {draft.type === "decision_bot" ? "Bot de Decisión" : "Agente de IA"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteBot.isPending}
          >
            {deleteBot.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateBot.isPending}
            className={saved ? "bg-green-600 hover:bg-green-600 text-white" : ""}
          >
            {updateBot.isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
              : saved
                ? <Check className="h-4 w-4 mr-1" />
                : <Save className="h-4 w-4 mr-1" />
            }
            {saved ? "Guardado" : "Guardar"}
          </Button>
        </div>
      </div>

      {draft.type === "decision_bot" ? (
        <>
          {/* Compact settings bar for decision bot */}
          <div className="shrink-0 px-5 py-3 border-b space-y-3">
            <div className="flex items-center gap-3">
              <BotAvatarUpload
                value={draft.avatar}
                name={draft.name}
                onChange={(v) => patch({ avatar: v })}
                compact
              />
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Nombre</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="Asistente de Ventas"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Label className="text-xs text-muted-foreground">Activo</Label>
                <Switch
                  checked={draft.active}
                  onCheckedChange={(v) => patch({ active: v })}
                />
              </div>
            </div>
          </div>

          {/* Flow canvas — takes all remaining height */}
          <div className="flex-1 min-h-0 p-3">
            <DecisionBotEditor
              steps={draft.steps ?? []}
              onChange={(steps) => patch({ steps })}
              allBots={otherBots}
              allAgents={otherAgents}
              members={members}
              departments={departments}
            />
          </div>
        </>
      ) : (
        /* Scrollable body for AI agent */
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <BotAvatarUpload
            value={draft.avatar}
            name={draft.name}
            onChange={(v) => patch({ avatar: v })}
          />

          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Asistente de Ventas"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Activo</p>
              <p className="text-xs text-muted-foreground">
                Los bots inactivos no responden en conversaciones nuevas.
              </p>
            </div>
            <Switch
              checked={draft.active}
              onCheckedChange={(v) => patch({ active: v })}
            />
          </div>

          <Separator />

          {/* Recopilación de datos del contacto */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Recopilación de datos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                El agente solicitará estos datos antes de atender la consulta.
              </p>
            </div>
            {(
              [
                { key: "collect_name",           label: "Nombre completo" },
                { key: "collect_phone",          label: "Teléfono" },
                { key: "collect_email",          label: "Correo electrónico" },
                { key: "collect_identification", label: "Cédula / Nº de cliente" },
              ] as const
            ).map(({ key, label }) => {
              const active = !!draft[key]
              return (
                <label key={key} className="flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer select-none">
                  <p className="text-sm">{label}</p>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={(e) => patch({ [key]: e.target.checked })}
                  />
                  <div
                    className={`relative inline-flex h-[18px] w-8 shrink-0 rounded-full transition-colors duration-200 ${active ? "bg-primary" : "bg-input"}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-[1px] ${active ? "translate-x-[14px]" : "translate-x-[1px]"}`}
                    />
                  </div>
                </label>
              )
            })}
          </div>

          <Separator />

          <AiAgentEditor
            data={{
              system_prompt:              draft.system_prompt,
              knowledge_item_ids:         draft.knowledge_item_ids,
              provider:                   draft.provider,
              model:                      draft.model,
              max_turns:                  draft.max_turns,
              rag_top_k:                  draft.rag_top_k,
              escalate_on_low_confidence: draft.escalate_on_low_confidence,
              default_department_id:      draft.default_department_id,
            }}
            onChange={patch}
          />

          <Separator />

          {/* Selector de protocolo */}
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">Protocolo asociado</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                El agente seguirá los pasos del protocolo en orden antes de usar el RAG libre.
              </p>
            </div>
            <Select
              value={draft.protocol_id ?? "none"}
              onValueChange={(v) => patch({ protocol_id: v === "none" ? null : v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin protocolo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin protocolo</SelectItem>
                {protocols.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {draft.protocol_id && (
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-2.5 py-1.5">
                El agente seguira los pasos del protocolo en orden. El RAG libre se usara solo al finalizar todos los pasos.
              </p>
            )}
          </div>

          <Separator />

          <PromptPreview botId={draft._id} />
        </div>
      )}
    </div>
  );
}
