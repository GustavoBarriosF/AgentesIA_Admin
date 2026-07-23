"use client";

import { Search, SlidersHorizontal, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConversationsStore } from "@/lib/stores/conversations.store";
import type { ConversationStatus } from "@/types/conversation";
import { cn } from "@/lib/utils";

const statusOptions: { value: ConversationStatus | undefined; label: string; active_only?: boolean }[] = [
  { value: undefined,     label: "Activas",      active_only: true },
  { value: "open",        label: "Abiertas" },
  { value: "bot",         label: "Bot" },
  { value: "pending",     label: "Pendientes" },
  { value: "assigned",    label: "Asignadas" },
  { value: "resolved",    label: "Archivadas" },
  { value: "abandoned",   label: "Abandonadas" },
];

export function ConversationFilters() {
  const { filters, setFilters } = useConversationsStore();
  const hasFilter = !!(filters.status || !filters.active_only === false);

  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
        <Input
          placeholder="Buscar..."
          className="pl-9 h-8 text-sm bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-border rounded-xl"
          onChange={() => {/* TODO: search */}}
        />
      </div>

      {/* Filter button */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center justify-center h-8 w-8 rounded-xl transition-colors outline-none",
            hasFilter
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              Estado
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((opt) => {
              const isSelected =
                filters.status === opt.value &&
                !!filters.active_only === !!opt.active_only;
              return (
                <DropdownMenuItem
                  key={opt.value ?? "all"}
                  onClick={() => setFilters({ status: opt.value, active_only: opt.active_only ?? false })}
                  className="flex items-center justify-between"
                >
                  <span className={cn(isSelected && "font-medium")}>{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
