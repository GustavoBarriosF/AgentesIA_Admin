import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, CheckCheck, Clock, AlertCircle, Bot, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/message";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageStatus({ message }: { message: Message }) {
  if (message._error)   return <AlertCircle className="h-3 w-3 text-destructive" />;
  if (message._pending) return <Clock className="h-3 w-3 opacity-60" />;
  if (message.read_at)  return <CheckCheck className="h-3 w-3 text-blue-300" />;
  return <Check className="h-3 w-3 opacity-60" />;
}

function AttachmentPreview({ message }: { message: Message }) {
  const att = message.attachments?.[0];
  if (!att) return null;
  const isImage = att.mime_type.startsWith("image/");

  if (isImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={att.url} alt={att.filename} className="max-w-[240px] rounded-xl object-cover" />
    );
  }

  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2.5 rounded-xl bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 transition-colors"
    >
      {isImage ? <ImageIcon className="h-4 w-4 shrink-0" /> : <FileText className="h-4 w-4 shrink-0" />}
      <span className="text-xs truncate max-w-[180px]">{att.filename}</span>
    </a>
  );
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const isSystem = message.sender_type === "system";
  const isBot    = message.sender_type === "bot";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] text-muted-foreground bg-background/80 border border-border/50 px-3 py-1 rounded-full shadow-sm">
          {message.content}
        </span>
      </div>
    );
  }

  const time = format(new Date(message.createdAt), "HH:mm", { locale: es });

  return (
    <div className={cn("flex gap-2 group mb-1", isOwn ? "flex-row-reverse" : "flex-row")}>
      {/* Bubble */}
      <div
        className={cn(
          "relative max-w-[72%] px-3.5 py-2.5 text-sm shadow-sm",
          isOwn
            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
            : "bg-background border border-border/60 text-foreground rounded-2xl rounded-tl-md",
          message._pending && "opacity-60",
          message._error && "ring-1 ring-destructive"
        )}
      >
        {/* Bot label */}
        {isBot && (
          <div className="flex items-center gap-1 mb-1.5 opacity-60">
            <Bot className="h-3 w-3" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Bot</span>
          </div>
        )}

        {/* Attachment */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2">
            <AttachmentPreview message={message} />
          </div>
        )}

        {/* Text */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        )}

        {/* Timestamp + status + SMS cost */}
        <div className={cn("flex items-center gap-1.5 mt-1.5", isOwn ? "justify-end" : "justify-start")}>
          {isOwn && message.channel_meta?.sms_cost != null && (
            <span className="text-[10px] opacity-50 font-mono" title={`${message.channel_meta.sms_segments} segmento(s)`}>
              ${message.channel_meta.sms_cost.toFixed(4)}
            </span>
          )}
          <span className={cn("text-[10px] opacity-60")}>
            {time}
          </span>
          {isOwn && <MessageStatus message={message} />}
        </div>
      </div>
    </div>
  );
}
