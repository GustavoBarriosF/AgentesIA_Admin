"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CheckCircle2, RefreshCw, MoreHorizontal, ExternalLink, Loader2, Trash2,
  Globe, Phone, Send, MessageSquare, Mail, Hash,
  Smartphone, Camera, LayoutGrid, Code, MessageCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { AgentAssignPicker } from "./AgentAssignPicker";
import { useResolveConversation, useReopenConversation, useDeleteConversation } from "@/lib/hooks/useConversations";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import type { Conversation } from "@/types/conversation";

// ─── Mapa de canales ─────────────────────────────────────────────────────────
const CHANNEL_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  web_widget:         { icon: Globe,         label: "Widget Web",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  whatsapp:           { icon: Phone,         label: "WhatsApp",    color: "bg-green-100 text-green-700 border-green-200" },
  whatsapp_baileys:   { icon: MessageCircle, label: "WA Informal", color: "bg-lime-100 text-lime-700 border-lime-200" },
  telegram:           { icon: Send,          label: "Telegram",    color: "bg-sky-100 text-sky-700 border-sky-200" },
  facebook_messenger: { icon: MessageSquare, label: "Messenger",   color: "bg-blue-100 text-blue-800 border-blue-200" },
  instagram_dm:       { icon: Camera,        label: "Instagram",   color: "bg-pink-100 text-pink-700 border-pink-200" },
  email:              { icon: Mail,          label: "Email",       color: "bg-amber-100 text-amber-700 border-amber-200" },
  sms:                { icon: Smartphone,    label: "SMS",         color: "bg-orange-100 text-orange-700 border-orange-200" },
  slack:              { icon: Hash,          label: "Slack",       color: "bg-violet-100 text-violet-700 border-violet-200" },
  teams:              { icon: LayoutGrid,     label: "Teams",       color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  line:               { icon: MessageSquare, label: "LINE",        color: "bg-green-100 text-green-800 border-green-200" },
  api:                { icon: Code,          label: "API",         color: "bg-gray-100 text-gray-600 border-gray-200" },
};

interface ConversationHeaderProps {
  conversation: Conversation;
}

export function ConversationHeader({ conversation }: ConversationHeaderProps) {
  const router = useRouter();
  const params = useParams();
  const resolve = useResolveConversation();
  const reopen = useReopenConversation();
  const deleteConv = useDeleteConversation();
  const { addToast } = useNotificationsStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { contact_id: contact, status, agent_id: agent, channel_id: channel } = conversation;
  const name = contact?.name ?? contact?.email ?? contact?.phone ?? "Sin nombre";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const isResolved = status === "resolved" || status === "abandoned";

  const handleResolve = async () => {
    try {
      await resolve.mutateAsync(conversation._id);
      addToast({ type: "success", message: "Conversación resuelta" });
    } catch {
      addToast({ type: "error", message: "No se pudo resolver" });
    }
  };

  const handleReopen = async () => {
    try {
      await reopen.mutateAsync(conversation._id);
      addToast({ type: "success", message: "Conversación reabierta" });
    } catch {
      addToast({ type: "error", message: "No se pudo reabrir" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConv.mutateAsync(conversation._id);
      setShowDeleteDialog(false);
      addToast({ type: "success", message: "Conversación eliminada" });
      router.push(`/${params.workspaceSlug}/conversations`);
    } catch {
      addToast({ type: "error", message: "No se pudo eliminar" });
    }
  };

  return (
    <div className="h-14 flex items-center justify-between px-4 border-b border-border/60 bg-background/80 backdrop-blur-sm shrink-0">
      {/* Contact info */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{name}</span>
            <StatusBadge status={status} />
            {/* Canal badge */}
            {(() => {
              const meta = CHANNEL_META[channel?.type ?? ""];
              if (!meta) return null;
              const Icon = meta.icon;
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
                  <Icon className="h-2.5 w-2.5" />
                  {meta.label}
                </span>
              );
            })()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {channel?.name && <span>{channel.name}</span>}
            {agent && (
              <>
                <span className="opacity-40">·</span>
                <span>{(agent as any).user_id?.name ?? (agent as any).user?.name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!isResolved && (
          <AgentAssignPicker
            convId={conversation._id}
            currentAgentId={agent?._id}
            currentDepartmentId={(conversation as any).department_id ?? undefined}
          />
        )}

        {!isResolved ? (
          <button
            onClick={handleResolve}
            disabled={resolve.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 hover:bg-emerald-600 transition-all disabled:opacity-60"
          >
            {resolve.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Resolver
          </button>
        ) : (
          <button
            onClick={handleReopen}
            disabled={reopen.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted transition-colors disabled:opacity-60"
          >
            {reopen.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Reabrir
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center justify-center h-8 w-8 rounded-xl hover:bg-muted transition-colors outline-none"
            aria-label="Más opciones"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/${params.workspaceSlug}/contacts/${contact?._id}`)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ver perfil del contacto
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar conversación
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>¿Eliminar conversación?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente la
              conversación y todos sus mensajes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive-solid" onClick={handleDelete} disabled={deleteConv.isPending}>
              {deleteConv.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
