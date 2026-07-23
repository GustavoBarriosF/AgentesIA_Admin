"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, Mail, Phone, MessageSquare, Globe, Send, Clock, Calendar, Trash2, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContactAvatar } from "./ContactAvatar";
import { CustomFieldsEditor } from "./CustomFieldsEditor";
import { useContact, useDeleteContact } from "@/lib/hooks/useContacts";
import { useNotificationsStore } from "@/lib/stores/notifications.store";

const CHANNEL_LABELS: Record<string, string> = {
  web_widget: "Web Widget",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  api: "API",
};

interface ContactDetailProps {
  contactId: string;
  onClose: () => void;
  onDelete?: () => void;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-xs break-all">{value}</p>
      </div>
    </div>
  );
}

export function ContactDetail({ contactId, onClose, onDelete }: ContactDetailProps) {
  const { data: contact, isLoading } = useContact(contactId);
  const deleteContact = useDeleteContact();
  const { addToast } = useNotificationsStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contactId);
      setShowDeleteDialog(false);
      addToast({ type: "success", message: "Contacto eliminado" });
      onDelete?.();
      onClose();
    } catch {
      addToast({ type: "error", message: "No se pudo eliminar el contacto" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contact) return null;

  const createdAt = format(new Date(contact.createdAt), "d MMM yyyy", { locale: es });
  const lastSeen = contact.last_seen
    ? format(new Date(contact.last_seen), "d MMM yyyy, HH:mm", { locale: es })
    : null;

  const hasCustomFields = Object.keys(contact.custom_fields ?? {}).length > 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h3 className="font-semibold text-sm">Detalle del contacto</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Eliminar contacto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center gap-2 px-4 py-5 border-b shrink-0">
        <ContactAvatar contact={contact} size="lg" />
        <div className="text-center">
          <p className="font-medium text-sm">{contact.name ?? "Sin nombre"}</p>
          <p className="text-xs text-muted-foreground">
            {CHANNEL_LABELS[contact.channel_type] ?? contact.channel_type}
          </p>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{contact.conversation_count} conversaciones</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-4 space-y-3 border-b">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Información
        </p>
        <div className="space-y-2.5">
          <InfoRow icon={Mail} label="Email" value={contact.email} />
          <InfoRow icon={Phone} label="Teléfono" value={contact.phone} />
          <InfoRow
            icon={contact.channel_type === "web_widget" ? Globe : contact.channel_type === "telegram" ? Send : Phone}
            label="Referencia de canal"
            value={contact.channel_ref}
          />
          <InfoRow icon={Clock} label="Última actividad" value={lastSeen} />
          <InfoRow icon={Calendar} label="Creado" value={createdAt} />
        </div>
      </div>

      {/* Custom fields */}
      <div className="px-4 py-4 group">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Campos personalizados
        </p>
        <CustomFieldsEditor
          contactId={contact._id}
          fields={contact.custom_fields ?? {}}
        />
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Eliminar contacto?</DialogTitle>
            <DialogDescription>
              Se eliminarán permanentemente el contacto, todas sus conversaciones y mensajes.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive-solid"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
            >
              {deleteContact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
