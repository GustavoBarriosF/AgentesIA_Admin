import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Globe, Phone, Send, MessageSquare, Mail,
  Smartphone, Camera, LayoutGrid, Code,
  MessageCircle, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "./StatusBadge";
import type { Conversation } from "@/types/conversation";

// ─── Configuración visual por canal ──────────────────────────────────────────

interface ChannelMeta {
  icon: React.ElementType;
  label: string;
  color: string; // Tailwind bg + text classes
  dot: string;   // Color hex para el dot badge
}

const CHANNEL_META: Record<string, ChannelMeta> = {
  web_widget:         { icon: Globe,         label: "Web",         color: "bg-blue-100 text-blue-600",     dot: "#3b82f6" },
  whatsapp:           { icon: Phone,         label: "WhatsApp",    color: "bg-green-100 text-green-600",   dot: "#22c55e" },
  whatsapp_baileys:   { icon: MessageCircle, label: "WA Informal", color: "bg-lime-100 text-lime-700",     dot: "#84cc16" },
  telegram:           { icon: Send,          label: "Telegram",    color: "bg-sky-100 text-sky-600",       dot: "#0ea5e9" },
  facebook_messenger: { icon: MessageSquare, label: "Messenger",   color: "bg-blue-100 text-blue-700",     dot: "#1d4ed8" },
  instagram_dm:       { icon: Camera,        label: "Instagram",   color: "bg-pink-100 text-pink-600",     dot: "#ec4899" },
  email:              { icon: Mail,          label: "Email",       color: "bg-amber-100 text-amber-600",   dot: "#f59e0b" },
  sms:                { icon: Smartphone,    label: "SMS",         color: "bg-orange-100 text-orange-600", dot: "#f97316" },
  slack:              { icon: Hash,          label: "Slack",       color: "bg-violet-100 text-violet-600", dot: "#7c3aed" },
  teams:              { icon: LayoutGrid,     label: "Teams",       color: "bg-indigo-100 text-indigo-600", dot: "#4f46e5" },
  line:               { icon: MessageSquare, label: "LINE",        color: "bg-green-100 text-green-700",   dot: "#16a34a" },
  api:                { icon: Code,          label: "API",         color: "bg-gray-100 text-gray-500",     dot: "#6b7280" },
};

const DEFAULT_META: ChannelMeta = {
  icon: MessageSquare, label: "Chat", color: "bg-gray-100 text-gray-500", dot: "#6b7280",
};

// ─── Componente ───────────────────────────────────────────────────────────────

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  unreadCount: number;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, unreadCount, onClick }: ConversationItemProps) {
  const { contact_id: contact, status, last_message, last_message_at, channel_id: channel } = conversation;

  const name = contact?.name ?? contact?.email ?? contact?.phone ?? "Sin nombre";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const timeAgo = last_message_at
    ? formatDistanceToNow(new Date(last_message_at), { addSuffix: false, locale: es })
    : "";

  const meta = CHANNEL_META[channel?.type ?? ""] ?? DEFAULT_META;
  const ChannelIcon = meta.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 group relative",
        isActive
          ? "bg-primary/10 ring-1 ring-primary/20 shadow-sm"
          : "hover:bg-muted/70"
      )}
    >
      {/* Active left accent bar */}
      {isActive && (
        <span className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-primary" />
      )}

      {/* Avatar + channel dot */}
      <div className="relative shrink-0 mt-0.5">
        <Avatar className="h-9 w-9">
          <AvatarFallback className={cn(
            "text-xs font-semibold",
            isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Canal badge (icono + color) */}
        <span
          title={meta.label}
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background flex items-center justify-center ring-1 ring-border"
          style={{ backgroundColor: meta.dot }}
        >
          <ChannelIcon className="h-2.5 w-2.5 text-white" />
        </span>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center px-0.5 font-bold ring-2 ring-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1 mb-0.5">
          <span className={cn(
            "text-sm truncate",
            unreadCount > 0 || isActive ? "font-semibold" : "font-medium text-foreground/80"
          )}>
            {name}
          </span>
          {timeAgo && (
            <span className={cn(
              "text-[10px] shrink-0",
              isActive ? "text-primary/70" : "text-muted-foreground"
            )}>
              {timeAgo}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1">
          <p className={cn(
            "text-xs truncate leading-relaxed",
            unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {last_message ?? "Conversación iniciada"}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {/* Canal label pill */}
            <span className={cn("hidden group-hover:inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full", meta.color)}>
              {meta.label}
            </span>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>
    </button>
  );
}
