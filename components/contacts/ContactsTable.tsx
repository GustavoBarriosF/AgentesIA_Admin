"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, Loader2, Users } from "lucide-react";
import { ContactAvatar } from "./ContactAvatar";
import { ContactsSearchBar } from "./ContactsSearchBar";
import { ContactsPagination } from "./ContactsPagination";
import { useContacts } from "@/lib/hooks/useContacts";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/contact";

const CHANNEL_LABELS: Record<string, string> = {
  web_widget: "Web",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  api: "API",
};

interface ContactsTableProps {
  page: number;
  search: string;
  selectedId: string | null;
  onPageChange: (page: number) => void;
  onSearchChange: (s: string) => void;
  onSelect: (contact: Contact) => void;
}

export function ContactsTable({
  page,
  search,
  selectedId,
  onPageChange,
  onSearchChange,
  onSelect,
}: ContactsTableProps) {
  const { data, isLoading, isFetching } = useContacts({ page, limit: 20, search });

  const contacts = data?.contacts ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Contactos</h2>
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
        <ContactsSearchBar value={search} onChange={(s) => { onSearchChange(s); onPageChange(1); }} />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-2 border-b bg-muted/40 text-xs font-medium text-muted-foreground shrink-0">
        <span>Contacto</span>
        <span>Email / Teléfono</span>
        <span>Canal</span>
        <span>Última vez</span>
        <span className="text-right">Chats</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">{search ? "Sin resultados para esa búsqueda" : "Sin contactos"}</p>
          </div>
        ) : (
          contacts.map((contact) => {
            const isActive = contact._id === selectedId;
            const lastSeen = contact.last_seen
              ? formatDistanceToNow(new Date(contact.last_seen), { addSuffix: true, locale: es })
              : "—";

            return (
              <button
                key={contact._id}
                onClick={() => onSelect(contact)}
                className={cn(
                  "w-full grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] gap-4 px-4 py-3 text-left border-b border-border/50 transition-colors",
                  isActive ? "bg-accent" : "hover:bg-muted/50"
                )}
              >
                {/* Name + avatar */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <ContactAvatar contact={contact} size="sm" />
                  <span className="text-sm font-medium truncate">
                    {contact.name ?? "Sin nombre"}
                  </span>
                </div>

                {/* Email / Phone */}
                <div className="flex flex-col justify-center min-w-0">
                  {contact.email && (
                    <span className="text-xs text-muted-foreground truncate">{contact.email}</span>
                  )}
                  {contact.phone && (
                    <span className="text-xs text-muted-foreground truncate">{contact.phone}</span>
                  )}
                  {!contact.email && !contact.phone && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>

                {/* Channel */}
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground">
                    {CHANNEL_LABELS[contact.channel_type] ?? contact.channel_type}
                  </span>
                </div>

                {/* Last seen */}
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground">{lastSeen}</span>
                </div>

                {/* Conversation count */}
                <div className="flex items-center justify-end gap-1">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs tabular-nums">{contact.conversation_count}</span>
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
          limit={20}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
