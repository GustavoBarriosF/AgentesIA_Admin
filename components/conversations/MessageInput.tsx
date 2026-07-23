"use client";

import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Send, Paperclip, X, FileText, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSendMessage, useUploadFile } from "@/lib/hooks/useMessages";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import { cn } from "@/lib/utils";
import { PaymentLinkModal } from "@/components/conversations/PaymentLinkModal";

interface MessageInputProps {
  convId: string;
  disabled?: boolean;
}

interface PendingFile {
  file: File;
  preview?: string;
}

export function MessageInput({ convId, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useSendMessage();
  const uploadFile = useUploadFile();
  const { addToast } = useNotificationsStore();

  const isSubmitting = sendMessage.isPending || uploadFile.isPending;

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = accepted.map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    maxSize: 50 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      const updated = [...prev];
      if (updated[index].preview) URL.revokeObjectURL(updated[index].preview!);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed && pendingFiles.length === 0) return;
    if (isSubmitting) return;

    try {
      if (pendingFiles.length > 0) {
        for (const pf of pendingFiles) {
          await uploadFile.mutateAsync({ convId, file: pf.file });
        }
        setPendingFiles([]);
      }
      if (trimmed) {
        await sendMessage.mutateAsync({ convId, content: trimmed });
        setContent("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    } catch {
      addToast({ type: "error", message: "No se pudo enviar el mensaje" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  };

  const canSend = (content.trim().length > 0 || pendingFiles.length > 0) && !isSubmitting;

  return (
    <div className="p-3 bg-background/80 backdrop-blur-sm border-t border-border/60">
      <input {...getInputProps()} />

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {pendingFiles.map((pf, i) => (
            <div
              key={i}
              className="relative flex items-center gap-1.5 bg-muted rounded-xl px-2.5 py-1.5 pr-7 max-w-[200px]"
            >
              {pf.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pf.preview} alt={pf.file.name} className="h-5 w-5 rounded object-cover shrink-0" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="text-xs truncate">{pf.file.name}</span>
              <button
                onClick={() => removeFile(i)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container — modern pill */}
      <div className={cn(
        "flex items-end gap-2 rounded-2xl border bg-background px-3 py-2 transition-shadow",
        disabled ? "opacity-60 cursor-not-allowed" : "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40"
      )}>
        {/* Attach button */}
        <button
          onClick={open}
          disabled={disabled}
          className="shrink-0 mb-0.5 h-7 w-7 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
          aria-label="Adjuntar archivo"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Payment link button */}
        <PaymentLinkModal convId={convId} disabled={disabled} />

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Conversación resuelta" : "Escribe un mensaje…"}
          disabled={disabled || isSubmitting}
          rows={1}
          className="min-h-[28px] max-h-[160px] resize-none py-1.5 text-sm leading-relaxed flex-1 overflow-y-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!canSend || disabled}
          className={cn(
            "shrink-0 mb-0.5 h-8 w-8 flex items-center justify-center rounded-xl transition-all duration-150",
            canSend && !disabled
              ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90 scale-100"
              : "bg-muted text-muted-foreground/50 cursor-not-allowed scale-95"
          )}
          aria-label="Enviar mensaje"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  );
}
