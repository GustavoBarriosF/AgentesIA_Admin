"use client";

import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadCard } from "./LeadCard";
import type { Lead, LeadStage } from "@/types/lead";

export const STAGE_CONFIG: Record<
  LeadStage,
  { label: string; accent: string; dot: string; bg: string }
> = {
  new:       { label: "Nuevo",      accent: "bg-slate-400",   dot: "bg-slate-400",   bg: "bg-slate-50   dark:bg-slate-900/30" },
  contacted: { label: "Contactado", accent: "bg-blue-500",    dot: "bg-blue-500",    bg: "bg-blue-50    dark:bg-blue-900/20"  },
  qualified: { label: "Calificado", accent: "bg-indigo-500",  dot: "bg-indigo-500",  bg: "bg-indigo-50  dark:bg-indigo-900/20"},
  proposal:  { label: "Propuesta",  accent: "bg-amber-500",   dot: "bg-amber-500",   bg: "bg-amber-50   dark:bg-amber-900/20" },
  won:       { label: "Ganado",     accent: "bg-emerald-500", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20"},
  lost:      { label: "Perdido",    accent: "bg-rose-500",    dot: "bg-rose-500",    bg: "bg-rose-50    dark:bg-rose-900/20"  },
};

interface LeadColumnProps {
  stage: LeadStage;
  leads: Lead[];
  isLoading: boolean;
  onCardClick: (lead: Lead) => void;
  onAddClick: () => void;
}

export function LeadColumn({ stage, leads, isLoading, onCardClick, onAddClick }: LeadColumnProps) {
  const cfg = STAGE_CONFIG[stage];
  const totalValue = leads.reduce((acc, l) => acc + (l.value ?? 0), 0);

  return (
    <div className="flex flex-col min-w-[240px] max-w-[280px] flex-1 rounded-2xl overflow-hidden border border-border/60 bg-card shadow-sm">
      {/* Column header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot} shadow-sm`} />
            <span className="text-sm font-semibold">{cfg.label}</span>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {leads.length}
            </span>
          </div>
          <button
            onClick={onAddClick}
            className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground tabular-nums mt-1 pl-[18px]">
            ${totalValue.toLocaleString()}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className={`h-0.5 mx-3 rounded-full ${cfg.accent} opacity-40`} />

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px]">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <p className="text-xs text-muted-foreground/60">Sin leads</p>
            <button
              onClick={onAddClick}
              className="text-xs text-primary/70 hover:text-primary transition-colors font-medium"
            >
              + Agregar
            </button>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard key={lead._id} lead={lead} onClick={() => onCardClick(lead)} />
          ))
        )}
      </div>
    </div>
  );
}
