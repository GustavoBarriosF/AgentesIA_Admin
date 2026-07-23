import { Globe, Phone, Send, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Contact } from "@/types/contact";

const channelIcons: Record<string, React.ElementType> = {
  web_widget: Globe,
  whatsapp: Phone,
  telegram: Send,
  api: MessageSquare,
};

interface ContactAvatarProps {
  contact: Contact;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

const iconSizes = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
};

export function ContactAvatar({ contact, size = "md" }: ContactAvatarProps) {
  const name = contact.name ?? contact.email ?? contact.phone ?? "?";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const ChannelIcon = channelIcons[contact.channel_type] ?? MessageSquare;

  return (
    <div className="relative inline-block">
      <Avatar className={sizeClasses[size]}>
        {contact.avatar_url && <AvatarImage src={contact.avatar_url} alt={name} />}
        <AvatarFallback className="bg-muted font-medium">{initials}</AvatarFallback>
      </Avatar>
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
        <ChannelIcon className={cn(iconSizes[size], "text-muted-foreground")} />
      </span>
    </div>
  );
}
