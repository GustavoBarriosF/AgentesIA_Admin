"use client";

import { useState } from "react";
import { TicketsTable } from "@/components/tickets/TicketsTable";
import { TicketDetail } from "@/components/tickets/TicketDetail";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";
import type { Ticket, TicketFilters } from "@/types/ticket";

export default function TicketsPage() {
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, limit: 20 });
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleFiltersChange = (partial: Partial<TicketFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleSelect = (ticket: Ticket) => {
    setSelectedTicketId(ticket._id);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TicketsTable
        filters={filters}
        selectedId={selectedTicketId}
        onFiltersChange={handleFiltersChange}
        onSelect={handleSelect}
        onCreateClick={() => setCreateOpen(true)}
      />

      <TicketDetail
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />

      <CreateTicketDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
