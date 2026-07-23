"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  ReactFlowProvider,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus, Trash2, MousePointerClick, Zap,
  UserRound, Mail, Phone, UserCog, TicketPlus,
  MessageSquareText, X, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dagre from "@dagrejs/dagre";
import { StepNode } from "./StepNode";
import type { BotStep, StepOption, ActionType, BotAgent, StepAction } from "@/types/bot";
import type { WorkspaceMember, Department } from "@/types/workspace";

// ─── Layout constants ─────────────────────────────────────────────────────────

const NODE_W  = 208;
const NODE_H  = 160;
const NODE_SEP = 60;   // horizontal gap between nodes in same rank
const RANK_SEP = 80;   // vertical gap between ranks

const nodeTypes = { stepNode: StepNode };

// ─── Graph helpers ────────────────────────────────────────────────────────────

function getActionTarget(action: StepAction, idx: number, total: number): number | null {
  switch (action.type) {
    case "next_step": return idx + 1 < total ? idx + 1 : null;
    case "goto_step": return action.goto_step_index ?? null;
    case "collect_name":
    case "collect_email":
    case "collect_phone":
    case "collect_text":
      if (action.collect_next_step_index != null) return action.collect_next_step_index;
      return idx + 1 < total ? idx + 1 : null;
    case "create_ticket": {
      const pa = action.ticket_config?.post_action ?? "end";
      if (pa === "goto_step" && action.ticket_config?.post_goto_step_index != null)
        return action.ticket_config.post_goto_step_index;
      if (pa === "next_step") return idx + 1 < total ? idx + 1 : null;
      return null; // end / escalate_human no conectan a otro paso local
    }
    default: return null;
  }
}

/** Returns the direct successor indices for a step (deduped, no self-loops). */
function stepChildren(step: BotStep, idx: number, total: number): number[] {
  const out = new Set<number>();
  if (step.options.length > 0) {
    step.options.forEach(opt => {
      const t = getActionTarget(opt.action, idx, total);
      if (t !== null && t !== idx) out.add(t);
    });
  } else if (step.action) {
    const t = getActionTarget(step.action, idx, total);
    if (t !== null && t !== idx) out.add(t);
  }
  return Array.from(out);
}

// ─── Dagre layout ────────────────────────────────────────────────────────────

/**
 * Uses dagre to compute a proper directed-graph layout.
 * Handles multi-parent nodes, back-edges, and orphans correctly.
 */
function computeTreeLayout(steps: BotStep[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  if (steps.length === 0) return positions;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "TB",       // top → bottom
    nodesep: NODE_SEP,   // horizontal spacing between nodes
    ranksep: RANK_SEP,   // vertical spacing between ranks
    marginx: 20,
    marginy: 20,
  });

  // Register every step as a node
  steps.forEach((_, i) => {
    g.setNode(String(i), { width: NODE_W, height: NODE_H });
  });

  // Add edges based on step connections
  steps.forEach((step, i) => {
    stepChildren(step, i, steps.length).forEach(c => {
      g.setEdge(String(i), String(c));
    });
  });

  dagre.layout(g);

  // dagre positions are center-based; convert to top-left
  steps.forEach((_, i) => {
    const n = g.node(String(i));
    if (n) {
      positions.set(String(i), { x: n.x - NODE_W / 2, y: n.y - NODE_H / 2 });
    }
  });

  return positions;
}

// ─── RF node/edge builders ────────────────────────────────────────────────────

function buildNodes(
  steps: BotStep[],
  selectedIndex: number | null,
  positions: Map<string, { x: number; y: number }>,
  onSelect: (i: number) => void,
  onDelete: (i: number, e: React.MouseEvent) => void,
): Node[] {
  return steps.map((step, i) => ({
    id: String(i),
    type: "stepNode",
    position: positions.get(String(i)) ?? { x: 0, y: i * (NODE_H + RANK_SEP) },
    data: {
      step,
      index: i,
      isSelected: selectedIndex === i,
      onSelect: () => onSelect(i),
      onDelete: (e: React.MouseEvent) => onDelete(i, e),
    },
  }));
}

function buildEdges(steps: BotStep[]): Edge[] {
  const edges: Edge[] = [];
  steps.forEach((step, i) => {
    if (step.options.length > 0) {
      step.options.forEach((opt, oi) => {
        const t = getActionTarget(opt.action, i, steps.length);
        if (t !== null && t !== i) {
          edges.push({
            id: `e${i}-o${oi}->${t}`,
            source: String(i),
            target: String(t),
            label: opt.label || `Opción ${oi + 1}`,
            labelStyle: { fontSize: 10 },
            labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9 },
            style: { stroke: "#93c5fd", strokeWidth: 1.5 },
          });
        }
      });
    } else if (step.action) {
      const t = getActionTarget(step.action, i, steps.length);
      if (t !== null && t !== i) {
        edges.push({
          id: `e${i}-a->${t}`,
          source: String(i),
          target: String(t),
          style: { stroke: "#fb923c", strokeWidth: 1.5 },
        });
      }
    }
  });
  return edges;
}

// ─── ActionEditor ─────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<ActionType, string> = {
  next_step:      "Continuar al siguiente paso",
  goto_step:      "Saltar a un paso específico",
  route_bot:      "Pasar a otro Bot",
  route_agent:    "Pasar a Agente de IA",
  escalate_human: "Escalar a agente humano",
  end:            "Finalizar conversación",
  collect_name:   "Solicitar nombre del contacto",
  collect_email:  "Solicitar correo electrónico",
  collect_phone:  "Solicitar número de teléfono",
  create_ticket:  "Crear ticket con resumen de IA",
  collect_text:   "Recibir respuesta de texto libre",
};

interface ActionEditorProps {
  action: StepAction;
  stepIndex: number;
  totalSteps: number;
  bots: BotAgent[];
  agents: BotAgent[];
  members: WorkspaceMember[];
  departments: Department[];
  onChange: (action: StepAction) => void;
}

function ActionEditor({ action, stepIndex, totalSteps, bots, agents, members, departments, onChange }: ActionEditorProps) {
  return (
    <div className="space-y-2">
      <Select value={action.type} onValueChange={(v) => v && onChange({ type: v as ActionType })}>
        <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {(Object.keys(ACTION_LABELS) as ActionType[]).map((t) => (
            <SelectItem key={t} value={t} className="text-xs">{ACTION_LABELS[t]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {action.type === "escalate_human" && (
        <div className="rounded-md border bg-orange-50/40 dark:bg-orange-950/10 p-2.5 space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><UserCog className="h-3 w-3" />Asignar conversación a:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Agente</p>
              <Select value={action.assigned_member_id ?? ""} onValueChange={(v) => onChange({ ...action, assigned_member_id: v || null, assigned_department_id: null })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">Sin asignar</SelectItem>
                  {members.filter(m => m.active && m.role !== "viewer").map((m) => (
                    <SelectItem key={m._id} value={m.user._id} className="text-xs">{m.user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Departamento</p>
              <Select value={action.assigned_department_id ?? ""} onValueChange={(v) => onChange({ ...action, assigned_department_id: v || null, assigned_member_id: null })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">Sin asignar</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d._id} value={d._id} className="text-xs">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input className="h-7 text-xs" placeholder="Mensaje de transferencia (opcional)" value={action.end_message ?? ""} onChange={(e) => onChange({ ...action, end_message: e.target.value })} />
        </div>
      )}

      {action.type === "goto_step" && (
        <Select value={String(action.goto_step_index ?? "")} onValueChange={(v) => v && onChange({ ...action, goto_step_index: Number(v) })}>
          <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="Seleccionar paso..." /></SelectTrigger>
          <SelectContent>
            {Array.from({ length: totalSteps }, (_, i) => i).filter(i => i !== stepIndex).map((i) => (
              <SelectItem key={i} value={String(i)} className="text-xs">Paso {i + 1}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {action.type === "route_bot" && (
        <Select value={action.target_bot_id ?? ""} onValueChange={(v) => v && onChange({ ...action, target_bot_id: v })}>
          <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="Seleccionar bot..." /></SelectTrigger>
          <SelectContent>
            {bots.length === 0
              ? <div className="px-2 py-1.5 text-xs text-muted-foreground">Sin bots de decisión</div>
              : bots.map((b) => <SelectItem key={b._id} value={b._id} className="text-xs">{b.name}</SelectItem>)
            }
          </SelectContent>
        </Select>
      )}

      {action.type === "route_agent" && (
        <Select value={action.target_agent_id ?? ""} onValueChange={(v) => v && onChange({ ...action, target_agent_id: v })}>
          <SelectTrigger className="w-full h-8 text-xs"><SelectValue placeholder="Seleccionar agente..." /></SelectTrigger>
          <SelectContent>
            {agents.length === 0
              ? <div className="px-2 py-1.5 text-xs text-muted-foreground">Sin agentes de IA</div>
              : agents.map((a) => <SelectItem key={a._id} value={a._id} className="text-xs">{a.name}</SelectItem>)
            }
          </SelectContent>
        </Select>
      )}

      {action.type === "end" && (
        <Input className="h-8 text-xs" placeholder="Mensaje de cierre (opcional)" value={action.end_message ?? ""} onChange={(e) => onChange({ ...action, end_message: e.target.value })} />
      )}

      {(action.type === "collect_name" || action.type === "collect_email" || action.type === "collect_phone") && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {action.type === "collect_name"  && <UserRound className="h-3 w-3" />}
            {action.type === "collect_email" && <Mail className="h-3 w-3" />}
            {action.type === "collect_phone" && <Phone className="h-3 w-3" />}
            <span>Mensaje al cliente</span>
          </div>
          <Input className="h-8 text-xs" placeholder={action.type === "collect_name" ? "¿Cuál es tu nombre?" : action.type === "collect_email" ? "¿Cuál es tu correo?" : "¿Cuál es tu teléfono?"} value={action.collect_message ?? ""} onChange={(e) => onChange({ ...action, collect_message: e.target.value })} />
          {(action.type === "collect_email" || action.type === "collect_phone") && (
            <>
              <div className="text-xs text-muted-foreground">Mensaje si el dato no es válido</div>
              <Input className="h-8 text-xs" placeholder={action.type === "collect_email" ? "Ese correo no parece válido." : "Ese número no parece válido."} value={action.collect_error_message ?? ""} onChange={(e) => onChange({ ...action, collect_error_message: e.target.value })} />
            </>
          )}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ir al paso después de recolectar</p>
            <Select value={action.collect_next_step_index != null ? String(action.collect_next_step_index) : "__auto__"} onValueChange={(v) => onChange({ ...action, collect_next_step_index: v === "__auto__" ? null : Number(v) })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__auto__" className="text-xs">Siguiente paso automático</SelectItem>
                {Array.from({ length: totalSteps }, (_, i) => i).map((i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">Paso {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {action.type === "collect_text" && (
        <div className="rounded-md border bg-sky-50/40 dark:bg-sky-950/10 p-2.5 space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquareText className="h-3 w-3" />El cliente puede escribir cualquier texto</p>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mensaje al cliente</p>
            <Input className="h-7 text-xs" placeholder="¿En qué te puedo ayudar?" value={action.collect_message ?? ""} onChange={(e) => onChange({ ...action, collect_message: e.target.value })} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Clave para guardar <span className="normal-case">(opcional)</span></p>
            <Input className="h-7 text-xs font-mono" placeholder="ej: motivo_consulta" value={action.collect_key ?? ""} onChange={(e) => onChange({ ...action, collect_key: e.target.value || null })} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ir al paso después de recolectar</p>
            <Select value={action.collect_next_step_index != null ? String(action.collect_next_step_index) : "__auto__"} onValueChange={(v) => onChange({ ...action, collect_next_step_index: v === "__auto__" ? null : Number(v) })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__auto__" className="text-xs">Siguiente paso automático</SelectItem>
                {Array.from({ length: totalSteps }, (_, i) => i).map((i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">Paso {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {action.type === "create_ticket" && (() => {
        const tc = action.ticket_config ?? {};
        const upTC = (patch: object) => onChange({ ...action, ticket_config: { ...tc, ...patch } });
        return (
          <div className="rounded-md border bg-violet-50/40 dark:bg-violet-950/10 p-2.5 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><TicketPlus className="h-3 w-3" />La IA resumirá y creará el ticket</p>

            {/* Prioridad */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Prioridad</p>
              <Select value={tc.priority ?? "medium"} onValueChange={(v) => upTC({ priority: v })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-xs">Baja</SelectItem>
                  <SelectItem value="medium" className="text-xs">Media</SelectItem>
                  <SelectItem value="high" className="text-xs">Alta</SelectItem>
                  <SelectItem value="urgent" className="text-xs">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asignación del ticket */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Agente del ticket</p>
                <Select value={tc.assigned_member_id ?? ""} onValueChange={(v) => upTC({ assigned_member_id: v || null, assigned_department_id: null })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-xs">Sin asignar</SelectItem>
                    {members.filter(m => m.active && m.role !== "viewer").map((m) => (
                      <SelectItem key={m._id} value={m.user._id} className="text-xs">{m.user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Depto. del ticket</p>
                <Select value={tc.assigned_department_id ?? ""} onValueChange={(v) => upTC({ assigned_department_id: v || null, assigned_member_id: null })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="" className="text-xs">Sin asignar</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d._id} value={d._id} className="text-xs">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mensaje de confirmación con variables */}
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Mensaje de confirmación</p>
              <Input className="h-7 text-xs" placeholder="Ticket #{{ticket}} registrado. Pronto te contactamos." value={tc.success_message ?? ""} onChange={(e) => upTC({ success_message: e.target.value })} />
              <p className="text-[10px] text-muted-foreground">Variables: <code className="bg-muted px-0.5 rounded">{"{{ticket}}"}</code> <code className="bg-muted px-0.5 rounded">{"{{nombre}}"}</code> <code className="bg-muted px-0.5 rounded">{"{{email}}"}</code> <code className="bg-muted px-0.5 rounded">{"{{telefono}}"}</code></p>
            </div>

            {/* Acción post-ticket */}
            <div className="space-y-1 border-t pt-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Después de crear el ticket</p>
              <Select value={tc.post_action ?? "end"} onValueChange={(v) => upTC({ post_action: v || "end" })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="end" className="text-xs">Finalizar conversación</SelectItem>
                  <SelectItem value="next_step" className="text-xs">Continuar al siguiente paso</SelectItem>
                  <SelectItem value="goto_step" className="text-xs">Saltar a un paso específico</SelectItem>
                  <SelectItem value="escalate_human" className="text-xs">Escalar a agente humano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tc.post_action === "goto_step" && (
              <Select value={String(tc.post_goto_step_index ?? "")} onValueChange={(v) => v !== "" && upTC({ post_goto_step_index: Number(v) })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Seleccionar paso..." /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalSteps }, (_, i) => i).map((i) => (
                    <SelectItem key={i} value={String(i)} className="text-xs">Paso {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {tc.post_action === "escalate_human" && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Escalar a agente</p>
                  <Select value={tc.post_escalate_member_id ?? ""} onValueChange={(v) => upTC({ post_escalate_member_id: v || null, post_escalate_department_id: null })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-xs">Sin asignar</SelectItem>
                      {members.filter(m => m.active && m.role !== "viewer").map((m) => (
                        <SelectItem key={m._id} value={m.user._id} className="text-xs">{m.user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Escalar a depto.</p>
                  <Select value={tc.post_escalate_department_id ?? ""} onValueChange={(v) => upTC({ post_escalate_department_id: v || null, post_escalate_member_id: null })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="text-xs">Sin asignar</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d._id} value={d._id} className="text-xs">{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── EditPanel ────────────────────────────────────────────────────────────────

interface EditPanelProps {
  step: BotStep;
  index: number;
  totalSteps: number;
  bots: BotAgent[];
  agents: BotAgent[];
  members: WorkspaceMember[];
  departments: Department[];
  onClose: () => void;
  onChange: (patch: Partial<BotStep>) => void;
}

function EditPanel({ step, index, totalSteps, bots, agents, members, departments, onClose, onChange }: EditPanelProps) {
  const mode: "empty" | "options" | "action" =
    step.options.length > 0 ? "options" : step.action ? "action" : "empty";

  const addOption      = () => onChange({ options: [...step.options, { label: "", action: { type: "next_step" } }], action: null });
  const addDirectAction = () => onChange({ options: [], action: { type: "next_step" } });
  const updateOption   = (oi: number, patch: Partial<StepOption>) => {
    const opts = [...step.options];
    opts[oi] = { ...opts[oi], ...patch };
    onChange({ options: opts });
  };
  const removeOption = (oi: number) => onChange({ options: step.options.filter((_, i) => i !== oi) });

  return (
    <div className="flex flex-col h-full bg-background border-l w-80 shrink-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30 shrink-0">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-400 text-white text-xs font-bold shrink-0">{index + 1}</span>
        <span className="text-sm font-semibold flex-1 truncate">{index === 0 ? "Bienvenida" : `Paso ${index + 1}`}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Mensaje del bot</Label>
          <Textarea className="text-sm min-h-[80px] resize-none" placeholder={index === 0 ? "Hola 👋 ¿En qué puedo ayudarte?" : "Escribe el mensaje..."} value={step.message} onChange={(e) => onChange({ message: e.target.value })} />
          <p className="text-[10px] text-muted-foreground">
            Variables disponibles:{" "}
            {["{{nombre}}", "{{email}}", "{{telefono}}"].map(v => (
              <code key={v} className="bg-muted px-0.5 rounded mr-1">{v}</code>
            ))}
          </p>
        </div>

        {mode === "options" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5 text-blue-500" />
                <Label className="text-xs">Opciones de respuesta</Label>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={addOption} className="text-xs text-primary hover:underline flex items-center gap-0.5"><Plus className="h-3 w-3" /> Agregar</button>
                <button type="button" onClick={() => onChange({ options: [], action: null })} className="text-xs text-muted-foreground hover:text-destructive">Limpiar</button>
              </div>
            </div>
            {step.options.map((opt, oi) => (
              <div key={oi} className="rounded-md border bg-blue-50/30 dark:bg-blue-950/10 p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold shrink-0">{oi + 1}</span>
                  <Input className="h-7 text-xs flex-1" placeholder="Texto del botón" value={opt.label} onChange={(e) => updateOption(oi, { label: e.target.value })} />
                  <button type="button" onClick={() => removeOption(oi)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="pl-7">
                  <p className="text-xs text-muted-foreground mb-1">Al elegir esta opción:</p>
                  <ActionEditor action={opt.action} stepIndex={index} totalSteps={totalSteps} bots={bots} agents={agents} members={members} departments={departments} onChange={(action) => updateOption(oi, { action })} />
                </div>
              </div>
            ))}
          </div>
        )}

        {mode === "action" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <Label className="text-xs">Acción directa</Label>
              </div>
              <button type="button" onClick={() => onChange({ action: null })} className="text-xs text-muted-foreground hover:text-destructive">Eliminar</button>
            </div>
            <div className="rounded-md border bg-amber-50/40 dark:bg-amber-950/10 p-2.5">
              <ActionEditor action={step.action!} stepIndex={index} totalSteps={totalSteps} bots={bots} agents={agents} members={members} departments={departments} onChange={(action) => onChange({ action })} />
            </div>
          </div>
        )}

        {mode === "empty" && (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center justify-center gap-1.5 h-9 rounded-md border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors outline-none">
              <Plus className="h-4 w-4" /> Agregar comportamiento
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64">
              <DropdownMenuItem onClick={addOption} className="gap-3 py-2.5">
                <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0"><MousePointerClick className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
                <div><p className="text-sm font-medium">Opción de respuesta</p><p className="text-xs text-muted-foreground">El usuario elige un botón</p></div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={addDirectAction} className="gap-3 py-2.5">
                <div className="h-8 w-8 rounded-md bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0"><Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" /></div>
                <div><p className="text-sm font-medium">Acción directa</p><p className="text-xs text-muted-foreground">El bot actúa automáticamente</p></div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ─── BotFlowCanvas ────────────────────────────────────────────────────────────

interface BotFlowEditorProps {
  steps: BotStep[];
  onChange: (steps: BotStep[]) => void;
  allBots: BotAgent[];
  allAgents: BotAgent[];
  members?: WorkspaceMember[];
  departments?: Department[];
}

function BotFlowCanvas({ steps, onChange, allBots, allAgents, members = [], departments = [] }: BotFlowEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  // Track whether we've done the initial layout
  const initializedRef  = useRef(false);
  const prevLengthRef   = useRef(steps.length);

  const applyLayout = useCallback((stps: BotStep[], selIdx: number | null, currentNodes: Node[]) => {
    // Extract positions from current node state (preserves user drag)
    const currentPos = new Map<string, { x: number; y: number }>(
      currentNodes.map(n => [n.id, n.position])
    );

    // Run tree layout — positions already in currentPos are kept for existing nodes
    const layoutPos = computeTreeLayout(stps);

    // For nodes NOT yet in currentPos (new ones), use tree layout position
    layoutPos.forEach((pos, key) => {
      if (!currentPos.has(key)) currentPos.set(key, pos);
    });

    setNodes(buildNodes(stps, selIdx, currentPos, setSelectedIndex, (i, e) => {
      e.stopPropagation();
      const next = stps.filter((_, idx) => idx !== i);
      setSelectedIndex(null);
      onChange(next);
    }));
    setEdges(buildEdges(stps));
  }, [onChange, setNodes, setEdges]);

  // Initial layout
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const layoutPos = computeTreeLayout(steps);
      setNodes(buildNodes(steps, null, layoutPos, setSelectedIndex, (i, e) => {
        e.stopPropagation();
        const next = steps.filter((_, idx) => idx !== i);
        setSelectedIndex(null);
        onChange(next);
      }));
      setEdges(buildEdges(steps));
      prevLengthRef.current = steps.length;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When steps change (edit, add, delete): sync edges + update node data keeping positions
  useEffect(() => {
    if (!initializedRef.current) return;
    setNodes(prev => {
      // Build position map from current RF state
      const currentPos = new Map<string, { x: number; y: number }>(prev.map(n => [n.id, n.position]));

      // If a step was added, place it with tree layout
      if (steps.length > prevLengthRef.current) {
        const layoutPos = computeTreeLayout(steps);
        layoutPos.forEach((pos, key) => {
          if (!currentPos.has(key)) currentPos.set(key, pos);
        });
      }

      // If a step was deleted, reindex positions (keys shift down)
      if (steps.length < prevLengthRef.current) {
        // Find which index was removed by comparing old node count
        // Simplest: rebuild positions for new count starting from scratch for new nodes
        // Keep positions for surviving nodes by their new indices
        // We can't perfectly know which was deleted, so just keep existing positions
        // and let orphan-placement handle any gaps.
      }

      prevLengthRef.current = steps.length;

      return buildNodes(steps, selectedIndex, currentPos, setSelectedIndex, (i, e) => {
        e.stopPropagation();
        const next = steps.filter((_, idx) => idx !== i);
        setSelectedIndex(null);
        onChange(next);
      });
    });
    setEdges(buildEdges(steps));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, selectedIndex]);

  // Re-run full tree layout on demand
  const relayout = useCallback(() => {
    const layoutPos = computeTreeLayout(steps);
    setNodes(prev => prev.map(n => ({
      ...n,
      position: layoutPos.get(n.id) ?? n.position,
    })));
  }, [steps, setNodes]);

  const addStep = () => {
    onChange([...steps, { message: "", options: [], action: null }]);
  };

  const selectedStep = selectedIndex !== null ? steps[selectedIndex] : null;
  const updateStep   = (patch: Partial<BotStep>) => {
    if (selectedIndex === null) return;
    const next = [...steps];
    next[selectedIndex] = { ...next[selectedIndex], ...patch };
    onChange(next);
  };

  return (
    <div className="flex h-full w-full overflow-hidden rounded-xl border">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onPaneClick={() => setSelectedIndex(null)}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          deleteKeyCode={null}
          minZoom={0.2}
          maxZoom={2}
          nodeTypes={nodeTypes}
        >
          <Background gap={16} color="#e2e8f0" />
          <Controls showInteractive={false} />
          <MiniMap nodeColor="#fb923c" maskColor="rgba(0,0,0,0.05)" pannable zoomable />

          <Panel position="top-right">
            <button
              onClick={relayout}
              title="Reorganizar como árbol"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 border shadow-sm text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Reorganizar
            </button>
          </Panel>

          <Panel position="bottom-center">
            <Button type="button" size="sm" variant="outline" className="bg-white dark:bg-zinc-900 shadow-sm gap-1.5" onClick={addStep}>
              <Plus className="h-4 w-4" />
              Agregar paso
            </Button>
          </Panel>
        </ReactFlow>

        {steps.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground">Sin pasos. Agrega el primero para comenzar.</p>
          </div>
        )}
      </div>

      {selectedStep !== null && selectedIndex !== null && (
        <EditPanel
          step={selectedStep}
          index={selectedIndex}
          totalSteps={steps.length}
          bots={allBots}
          agents={allAgents}
          members={members}
          departments={departments}
          onClose={() => setSelectedIndex(null)}
          onChange={updateStep}
        />
      )}
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function BotFlowEditor(props: BotFlowEditorProps) {
  return (
    <ReactFlowProvider>
      <BotFlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
