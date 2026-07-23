"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, TicketX, Plus } from "lucide-react";
import { TicketStatusBadge, TicketPriorityBadge, SlaBreach } from "./TicketBadges";
import { TicketsFilters } from "./TicketsFilters";
import { ContactsPagination } from "@/components/contacts/ContactsPagination";
import { useTickets } from "@/lib/hooks/useTickets";
import { cn } from "@/lib/utils";
import type { Ticket, TicketFilters } from "@/types/ticket";

interface TicketsTableProps {
  filters: TicketFilters;
  selectedId: string | null;
  onFiltersChange: (f: Partial<TicketFilters>) => void;
  onSelect: (ticket: Ticket) => void;
  onCreateClick: () => void;
}

export function TicketsTable({
  filters,
  selectedId,
  onFiltersChange,
  onSelect,
  onCreateClick,
}: TicketsTableProps) {
  const { data, isLoading, isFetching } = useTickets(filters);

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const page = filters.page ?? 1;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Tickets</h2>
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <TicketsFilters filters={filters} onFiltersChange={onFiltersChange} />
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo ticket
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 px-4 py-2 border-b bg-muted/40 text-xs font-medium text-muted-foreground shrink-0">
        <span>Ticket</span>
        <span>Estado</span>
        <span>Prioridad</span>
        <span>Asignado a</span>
        <span className="text-right">Creado</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <TicketX className="h-8 w-8" />
            <p className="text-sm">Sin tickets</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const isActive = ticket._id === selectedId;
            const contactName = ticket.contact_id?.name ?? ticket.contact_id?.email ?? "Contacto";
            const agentName = ticket.assigned_to?.user_id?.name ?? "Sin asignar";
            const timeAgo = formatDistanceToNow(new Date(ticket.createdAt), {
              addSuffix: true,
              locale: es,
            });

            return (
              <button
                key={ticket._id}
                onClick={() => onSelect(ticket)}
                className={cn(
                  "w-full grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 px-4 py-3 text-left border-b border-border/50 transition-colors",
                  isActive ? "bg-accent" : "hover:bg-muted/50"
                )}
              >
                {/* Title + contact */}
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-1.5">
                    {ticket.sla_breach && <SlaBreach />}
                    <span className="text-sm font-medium truncate">{ticket.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{contactName}</span>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <TicketStatusBadge status={ticket.status} />
                </div>

                {/* Priority */}
                <div className="flex items-center">
                  <TicketPriorityBadge priority={ticket.priority} />
                </div>

                {/* Assigned to */}
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground truncate">{agentName}</span>
                </div>

                {/* Created at */}
                <div className="flex items-center justify-end">
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="shrink-0">
        <ContactsPagination
          page={page}
          total={total}
          limit={filters.limit ?? 20}
          onPageChange={(p) => onFiltersChange({ page: p })}
        />
      </div>
    </div>
  );
}
