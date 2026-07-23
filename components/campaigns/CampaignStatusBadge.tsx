"use client";

import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/lib/hooks/useCampaigns";

const CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  draft:     { label: "Borrador",   className: "bg-muted text-muted-foreground border-border" },
  scheduled: { label: "Programada", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300" },
  running:   { label: "En curso",   className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300" },
  paused:    { label: "Pausada",    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300" },
  completed: { label: "Completada", className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300" },
  cancelled: { label: "Cancelada",  className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.draft;
  return (
    <Badge variant="outline" className={`text-xs font-medium ${className}`}>
      {label}
    </Badge>
  );
}
