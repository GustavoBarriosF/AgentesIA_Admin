"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquareDashed, Sparkles } from "lucide-react";
import { useConversation } from "@/lib/hooks/useConversations";
import { useMessages, useMarkAsRead } from "@/lib/hooks/useMessages";
import { useConversationsStore } from "@/lib/stores/conversations.store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { ConversationHeader } from "./ConversationHeader";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { MessageInput } from "./MessageInput";
import type { Message } from "@/types/message";

interface ChatPanelProps {
  convId: string;
}

function ChatPanelContent({ convId }: ChatPanelProps) {
  const user = useAuthStore((s) => s.user);
  const { clearUnread } = useConversationsStore();
  const { data: conversation, isLoading: convLoading } = useConversation(convId);
  const {
    data: messagesData,
    isLoading: msgsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useMessages(convId);
  const markAsRead = useMarkAsRead();
  const [isTyping, setIsTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const allMessages: Message[] = (
    messagesData?.pages.slice().reverse().flatMap((p) => p.data ?? []) ?? []
  ).filter(Boolean);

  useEffect(() => {
    if (allMessages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: isFirstLoad.current ? "instant" : "smooth" });
    isFirstLoad.current = false;
  }, [allMessages.length, convId]);

  useEffect(() => {
    clearUnread(convId);
    markAsRead.mutate(convId);
    isFirstLoad.current = true;
  }, [convId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (convLoading || msgsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center chat-bg">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
          <p className="text-xs">Cargando conversación…</p>
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  const isResolved = conversation.status === "resolved" || conversation.status === "abandoned";

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader conversation={conversation} />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 chat-bg">
        <div ref={topRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <div className="h-14 w-14 rounded-2xl bg-background/80 border border-border shadow-sm flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-sm font-medium">Conversación sin mensajes</p>
            <p className="text-xs text-muted-foreground/60">Sé el primero en escribir</p>
          </div>
        ) : (
          allMessages.map((message) => {
            const isOwn = message.sender_type === "agent" || message.sender_type === "bot";
            return <MessageBubble key={message._id} message={message} isOwn={isOwn} />;
          })
        )}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <MessageInput convId={convId} disabled={isResolved} />
    </div>
  );
}

export function ChatPanel() {
  const { selectedConversationId } = useConversationsStore();

  if (!selectedConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 chat-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-20 w-20 rounded-3xl bg-background/90 border border-border shadow-sm flex items-center justify-center">
            <MessageSquareDashed className="h-9 w-9 text-primary/40" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground/70">Ninguna conversación activa</p>
            <p className="text-xs text-muted-foreground mt-0.5">Selecciona una del panel izquierdo</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full border-l border-border/60">
      <ChatPanelContent convId={selectedConversationId} />
    </div>
  );
}
