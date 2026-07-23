"use client";

import { SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TicketStatus, TicketPriority, TicketFilters } from "@/types/ticket";

const statusOptions: { value: TicketStatus | undefined; label: string }[] = [
  { value: undefined,      label: "Todos los estados" },
  { value: "open",         label: "Abierto" },
  { value: "in_progress",  label: "En progreso" },
  { value: "waiting",      label: "Esperando" },
  { value: "resolved",     label: "Resuelto" },
  { value: "closed",       label: "Cerrado" },
];

const priorityOptions: { value: TicketPriority | undefined; label: string }[] = [
  { value: undefined,  label: "Todas las prioridades" },
  { value: "urgent",   label: "Urgente" },
  { value: "high",     label: "Alta" },
  { value: "medium",   label: "Media" },
  { value: "low",      label: "Baja" },
];

interface TicketsFiltersProps {
  filters: TicketFilters;
  onFiltersChange: (f: Partial<TicketFilters>) => void;
}

export function TicketsFilters({ filters, onFiltersChange }: TicketsFiltersProps) {
  const activeCount = [filters.status, filters.priority, filters.assigned_to].filter(Boolean).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-sm transition-colors outline-none border border-border",
          "hover:bg-muted",
          activeCount > 0 && "bg-primary/10 border-primary/30 text-primary"
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filtros
        {activeCount > 0 && (
          <Badge variant="secondary" className="h-4 text-[10px] px-1 min-w-4">
            {activeCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Estado</DropdownMenuLabel>
          {statusOptions.map((opt) => (
            <DropdownMenuItem
              key={opt.value ?? "all-status"}
              onClick={() => onFiltersChange({ status: opt.value, page: 1 })}
              className={cn(filters.status === opt.value && "bg-accent font-medium")}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Prioridad</DropdownMenuLabel>
          {priorityOptions.map((opt) => (
            <DropdownMenuItem
              key={opt.value ?? "all-priority"}
              onClick={() => onFiltersChange({ priority: opt.value, page: 1 })}
              className={cn(filters.priority === opt.value && "bg-accent font-medium")}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
