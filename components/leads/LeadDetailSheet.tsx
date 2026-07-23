"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Send, Loader2, DollarSign, Tag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateLead, useAddLeadNote } from "@/lib/hooks/useLeads";
import { STAGE_CONFIG } from "./LeadColumn";
import type { Lead, LeadStage } from "@/types/lead";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  const [noteText, setNoteText] = useState("");
  const [editValue, setEditValue] = useState<string>("");
  const [editingValue, setEditingValue] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const updateLead = useUpdateLead();
  const addNote = useAddLeadNote();

  if (!lead) return null;

  const contact = lead.contact_id;

  const handleStageChange = (stage: string | null) => {
    if (!stage || stage === lead.stage) return;
    updateLead.mutate({ leadId: lead._id, stage: stage as LeadStage, ...(stage !== "lost" ? { lost_reason: "" } : {}) });
  };

  const handleValueSave = () => {
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      updateLead.mutate({ leadId: lead._id, value: val });
    }
    setEditingValue(false);
  };

  const handleLostReasonSave = () => {
    if (!lostReason.trim()) return;
    updateLead.mutate({ leadId: lead._id, lost_reason: lostReason.trim() });
    setLostReason("");
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNote.mutateAsync({ leadId: lead._id, content: noteText.trim() });
    setNoteText("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="pr-6">{contact?.name ?? "Lead"}</SheetTitle>
          {contact?.email && (
            <p className="text-sm text-muted-foreground">{contact.email}</p>
          )}
          {contact?.phone && (
            <p className="text-sm text-muted-foreground">{contact.phone}</p>
          )}
        </SheetHeader>

        <SheetBody className="space-y-5">
          {/* Stage */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Etapa</Label>
            <Select value={lead.stage} onValueChange={handleStageChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STAGE_CONFIG) as LeadStage[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${STAGE_CONFIG[s].dot}`} />
                      {STAGE_CONFIG[s].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lost reason */}
          {lead.stage === "lost" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Razón de pérdida</Label>
              {lead.lost_reason ? (
                <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">
                  {lead.lost_reason}
                </p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: Precio, competencia..."
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLostReasonSave()}
                  />
                  <Button size="sm" onClick={handleLostReasonSave} disabled={!lostReason.trim()}>
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Value */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Valor estimado</Label>
            {editingValue ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleValueSave(); if (e.key === "Escape") setEditingValue(false); }}
                  autoFocus
                />
                <Button size="sm" onClick={handleValueSave}>OK</Button>
              </div>
            ) : (
              <button
                onClick={() => { setEditValue(String(lead.value ?? "")); setEditingValue(true); }}
                className="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
              >
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                {lead.value != null
                  ? `${lead.value.toLocaleString()} ${lead.currency}`
                  : <span className="text-muted-foreground italic">Sin valor — clic para agregar</span>
                }
              </button>
            )}
          </div>

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Tag className="h-3 w-3" /> Etiquetas
              </Label>
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Notas ({lead.notes?.length ?? 0})
            </Label>

            {/* Add note */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Agregar nota..."
                className="min-h-[72px] resize-none text-sm"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              onClick={handleAddNote}
              disabled={!noteText.trim() || addNote.isPending}
            >
              {addNote.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                : <Send className="h-4 w-4 mr-2" />
              }
              Agregar nota
            </Button>

            {/* Notes list */}
            <div className="space-y-3">
              {[...(lead.notes ?? [])].reverse().map((note, i) => (
                <div key={note._id ?? i} className="rounded-md border bg-muted/30 p-3 space-y-1">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.createdAt), "d MMM yyyy · HH:mm", { locale: es })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
