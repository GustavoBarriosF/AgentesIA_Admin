"use client";

import { useEffect, useRef } from "react";
import { Loader2, MessageSquareDashed, MessagesSquare } from "lucide-react";
import { useConversations } from "@/lib/hooks/useConversations";
import { useConversationsStore } from "@/lib/stores/conversations.store";
import { ConversationItem } from "./ConversationItem";
import { ConversationFilters } from "./ConversationFilters";
import type { Conversation } from "@/types/conversation";

export function ConversationList() {
  const { filters, selectedConversationId, selectConversation, unreadCounts } = useConversationsStore();
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useConversations(filters);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bottomRef.current;
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

  const conversations: Conversation[] = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="flex flex-col h-full border-r border-border/60 bg-background">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessagesSquare className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-bold text-sm">Conversaciones</h2>
        </div>
        {conversations.length > 0 && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {conversations.length}
          </span>
        )}
      </div>

      {/* Filters */}
      <ConversationFilters />

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
              <MessageSquareDashed className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium">Sin conversaciones</p>
            <p className="text-xs text-muted-foreground/70">Aquí aparecerán tus chats</p>
          </div>
        ) : (
          <>
            {conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                isActive={conv._id === selectedConversationId}
                unreadCount={unreadCounts[conv._id] ?? 0}
                onClick={() => selectConversation(conv._id)}
              />
            ))}
            <div ref={bottomRef} className="py-1">
              {isFetchingNextPage && (
                <div className="flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
