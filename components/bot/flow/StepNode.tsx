"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MousePointerClick, Zap, MessageSquare, Trash2 } from "lucide-react";
import type { BotStep } from "@/types/bot";

export interface StepNodeData {
  step: BotStep;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ACTION_COLORS: Record<string, string> = {
  escalate_human: "bg-green-500",
  end:            "bg-red-400",
  route_bot:      "bg-violet-500",
  route_agent:    "bg-indigo-500",
  create_ticket:  "bg-pink-500",
  collect_name:   "bg-sky-500",
  collect_email:  "bg-sky-500",
  collect_phone:  "bg-sky-500",
  collect_text:   "bg-sky-500",
  goto_step:      "bg-orange-400",
  next_step:      "bg-gray-400",
};

const ACTION_LABELS: Record<string, string> = {
  escalate_human: "Escalar a agente",
  end:            "Finalizar",
  route_bot:      "Pasar a bot",
  route_agent:    "Pasar a IA",
  create_ticket:  "Crear ticket",
  collect_name:   "Solicitar nombre",
  collect_email:  "Solicitar email",
  collect_phone:  "Solicitar teléfono",
  collect_text:   "Solicitar texto",
  goto_step:      "Ir a paso",
  next_step:      "Siguiente paso",
};

export function StepNode({ data }: NodeProps) {
  const { step, index, isSelected, onSelect, onDelete } = data as unknown as StepNodeData;
  const mode: "options" | "action" | "empty" =
    step.options?.length > 0 ? "options" : step.action ? "action" : "empty";

  return (
    <div
      onClick={onSelect}
      className={`
        relative w-52 rounded-xl border-2 shadow-md cursor-pointer transition-all
        bg-white dark:bg-zinc-900
        ${isSelected
          ? "border-orange-400 shadow-orange-200 dark:shadow-orange-900 shadow-lg"
          : "border-zinc-200 dark:border-zinc-700 hover:border-orange-300"
        }
      `}
    >
      {/* Top handle */}
      {index > 0 && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-orange-400 !border-white !border-2"
        />
      )}

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-[10px] ${isSelected ? "bg-orange-50 dark:bg-orange-950/30" : "bg-zinc-50 dark:bg-zinc-800"}`}>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 text-white text-[10px] font-bold shrink-0">
          {index + 1}
        </span>
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate flex-1">
          {index === 0 ? "Bienvenida" : `Paso ${index + 1}`}
        </span>
        <button
          onClick={onDelete}
          className="text-zinc-400 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Message preview */}
      <div className="px-3 py-2">
        <div className="flex items-start gap-1.5">
          <MessageSquare className="h-3 w-3 text-zinc-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
            {step.message || <span className="italic">Sin mensaje</span>}
          </p>
        </div>
      </div>

      {/* Footer badge */}
      <div className="px-3 pb-2.5">
        {mode === "options" && (
          <div className="flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 px-2 py-1">
            <MousePointerClick className="h-3 w-3 text-blue-500 shrink-0" />
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium truncate">
              {step.options.length} opción{step.options.length !== 1 ? "es" : ""}
              {step.options.map(o => o.label).filter(Boolean).length > 0 &&
                `: ${step.options.map(o => o.label).filter(Boolean).slice(0, 2).join(", ")}`
              }
            </span>
          </div>
        )}
        {mode === "action" && (
          <div className={`flex items-center gap-1 rounded-md px-2 py-1 ${
            ACTION_COLORS[step.action!.type]
              ? `bg-opacity-10 border`
              : "bg-amber-50 border-amber-100"
          }`}
          style={{ backgroundColor: `${getColorHex(step.action!.type)}15`, borderColor: `${getColorHex(step.action!.type)}30` }}
          >
            <Zap className="h-3 w-3 shrink-0" style={{ color: getColorHex(step.action!.type) }} />
            <span className="text-[10px] font-medium truncate" style={{ color: getColorHex(step.action!.type) }}>
              {ACTION_LABELS[step.action!.type] ?? step.action!.type}
            </span>
          </div>
        )}
        {mode === "empty" && (
          <div className="flex items-center gap-1 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-dashed border-zinc-200 dark:border-zinc-700 px-2 py-1">
            <span className="text-[10px] text-zinc-400">Sin acción configurada</span>
          </div>
        )}
      </div>

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-orange-400 !border-white !border-2"
      />
    </div>
  );
}

function getColorHex(actionType: string): string {
  const map: Record<string, string> = {
    escalate_human: "#22c55e",
    end:            "#f87171",
    route_bot:      "#a855f7",
    route_agent:    "#6366f1",
    create_ticket:  "#ec4899",
    collect_name:   "#0ea5e9",
    collect_email:  "#0ea5e9",
    collect_phone:  "#0ea5e9",
    collect_text:   "#0ea5e9",
    goto_step:      "#f97316",
    next_step:      "#94a3b8",
  };
  return map[actionType] ?? "#94a3b8";
}
