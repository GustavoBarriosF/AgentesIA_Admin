"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProtocolStep } from "@/types/knowledge";

interface Props {
  steps: ProtocolStep[];
  onChange: (steps: ProtocolStep[]) => void;
}

function emptyStep(stepNumber: number): ProtocolStep {
  return {
    step_number: stepNumber,
    title: "",
    instructions: "",
    completion_signal: null,
    requires_data: null,
    max_turns_in_step: 5,
  };
}

export function ProtocolStepsEditor({ steps, onChange }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(steps.length === 0 ? null : 0);

  const addStep = () => {
    const newSteps = [...steps, emptyStep(steps.length + 1)];
    onChange(newSteps);
    setExpandedIdx(newSteps.length - 1);
  };

  const removeStep = (idx: number) => {
    const newSteps = steps
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, step_number: i + 1 }));
    onChange(newSteps);
    if (expandedIdx !== null && expandedIdx >= newSteps.length) {
      setExpandedIdx(newSteps.length - 1);
    }
  };

  const updateStep = (idx: number, patch: Partial<ProtocolStep>) => {
    const newSteps = steps.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(newSteps);
  };

  return (
    <div className="space-y-2">
      {steps.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          Sin pasos aun. Agrega el primer paso para definir el protocolo.
        </p>
      )}

      {steps.map((step, idx) => {
        const isOpen = expandedIdx === idx;
        return (
          <div key={idx} className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer select-none"
              onClick={() => setExpandedIdx(isOpen ? null : idx)}
            >
              <span className="text-xs font-semibold text-muted-foreground w-6 shrink-0">
                #{step.step_number}
              </span>
              <span className="flex-1 text-sm font-medium truncate">
                {step.title || <span className="text-muted-foreground italic">Sin título</span>}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={(e) => { e.stopPropagation(); removeStep(idx); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {isOpen
                ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              }
            </div>

            {/* Body */}
            {isOpen && (
              <div className="px-3 py-3 space-y-3 border-t">
                {/* Título */}
                <div className="space-y-1">
                  <Label className="text-xs">Título del paso</Label>
                  <Input
                    placeholder="ej: Saludo inicial"
                    value={step.title}
                    onChange={(e) => updateStep(idx, { title: e.target.value })}
                  />
                </div>

                {/* Instrucciones */}
                <div className="space-y-1">
                  <Label className="text-xs">Instrucciones para el agente</Label>
                  <Textarea
                    placeholder="Describe qué debe hacer el agente en este paso..."
                    className="min-h-[80px] resize-none text-sm"
                    value={step.instructions}
                    onChange={(e) => updateStep(idx, { instructions: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Señal de completitud */}
                  <div className="space-y-1">
                    <Label className="text-xs">Señal de completitud</Label>
                    <Input
                      placeholder="ej: [paso_completado]"
                      value={step.completion_signal ?? ""}
                      onChange={(e) =>
                        updateStep(idx, { completion_signal: e.target.value || null })
                      }
                    />
                  </div>

                  {/* Max turns */}
                  <div className="space-y-1">
                    <Label className="text-xs">Máximo de turnos</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={step.max_turns_in_step}
                      onChange={(e) =>
                        updateStep(idx, { max_turns_in_step: parseInt(e.target.value) || 5 })
                      }
                    />
                  </div>
                </div>

                {/* Requiere dato */}
                <div className="space-y-1">
                  <Label className="text-xs">Dato requerido</Label>
                  <Select
                    value={step.requires_data ?? "none"}
                    onValueChange={(v) =>
                      updateStep(idx, {
                        requires_data: v === "none" ? null : (v as ProtocolStep["requires_data"]),
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Teléfono</SelectItem>
                      <SelectItem value="identification">Documento / Identificación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={addStep} className="w-full">
        <Plus className="h-4 w-4 mr-1.5" />
        Agregar paso
      </Button>
    </div>
  );
}
