"use client";

import { useState } from "react";
import { Loader2, X, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCreateTicket } from "@/lib/hooks/useTickets";
import { useContacts } from "@/lib/hooks/useContacts";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import type { TicketPriority } from "@/types/ticket";
import type { Contact } from "@/types/contact";

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low",    label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high",   label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const createTicket = useCreateTicket();
  const { addToast } = useNotificationsStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [contactSearch, setContactSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactPickerOpen, setContactPickerOpen] = useState(false);

  const { data: contactsData } = useContacts({
    search: contactSearch,
    limit: 10,
    page: 1,
  });
  const contacts = contactsData?.contacts ?? [];

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setContactSearch("");
    setSelectedContact(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedContact) return;

    try {
      await createTicket.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        contact_id: selectedContact._id,
        priority,
      });
      addToast({ type: "success", message: "Ticket creado exitosamente" });
      handleClose();
    } catch {
      addToast({ type: "error", message: "No se pudo crear el ticket" });
    }
  };

  const selectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactSearch(contact.name ?? contact.email ?? contact.phone ?? "");
    setContactPickerOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo ticket</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">Título *</Label>
            <Input
              id="ticket-title"
              placeholder="Ej: Problema con el pago"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Contact picker */}
          <div className="space-y-1.5">
            <Label>Contacto *</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar contacto..."
                value={contactSearch}
                className="pl-8"
                onFocus={() => setContactPickerOpen(true)}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setSelectedContact(null);
                  setContactPickerOpen(true);
                }}
              />
              {contactPickerOpen && contacts.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                  {contacts.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => selectContact(c)}
                      className="w-full flex flex-col px-3 py-2 text-left hover:bg-muted transition-colors"
                    >
                      <span className="text-sm font-medium">{c.name ?? "Sin nombre"}</span>
                      {(c.email || c.phone) && (
                        <span className="text-xs text-muted-foreground">
                          {c.email ?? c.phone}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedContact && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                ✓ {selectedContact.name ?? selectedContact.email}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc">Descripción</Label>
            <Textarea
              id="ticket-desc"
              placeholder="Describe el problema en detalle..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label>Prioridad</Label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`flex-1 h-8 rounded-md text-xs font-medium border transition-colors ${
                    priority === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 rounded-md text-sm border border-border hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !selectedContact || createTicket.isPending}
              className="h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {createTicket.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Crear ticket
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
