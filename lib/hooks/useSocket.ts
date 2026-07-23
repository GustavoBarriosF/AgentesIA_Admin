"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, disconnectSocket, joinWorkspace } from "@/lib/socket";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useConversationsStore } from "@/lib/stores/conversations.store";
import { useAgentsStore } from "@/lib/stores/agents.store";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import type { Message } from "@/types/message";
import type { Conversation } from "@/types/conversation";
import type { AgentPresence } from "@/types/agent";

export function useSocket() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const activeWorkspace = useAuthStore((s) => s.activeWorkspace);
  const { selectedConversationId, incrementUnread, selectConversation } = useConversationsStore();
  const { updateAgentPresence } = useAgentsStore();
  const { addNotification, addToast } = useNotificationsStore();
  const connectedRef = useRef(false);
  // Ref para siempre tener el selectedConversationId actual dentro de los closures de socket
  const selectedConvRef = useRef<string | null>(null);
  selectedConvRef.current = selectedConversationId ?? null;

  const workspaceId = activeWorkspace?.workspace._id;

  useEffect(() => {
    if (!token || !workspaceId) return;
    if (connectedRef.current) return;

    const socket = connectSocket(token);
    connectedRef.current = true;

    socket.on("connect", () => {
      joinWorkspace(workspaceId);
    });

    // New message received
    socket.on("new:message", (data: { message?: Message; conversationId: string }) => {
      const { message, conversationId } = data;
      const queryKey = ["messages", workspaceId, conversationId];

      if (message) {
        // Add to message cache
        queryClient.setQueryData(queryKey, (old: { pages: { data: Message[] }[] } | undefined) => {
          if (!old) return old;
          const pages = [...old.pages];
          const last = pages[pages.length - 1];
          // Avoid duplicates (optimistic update already added it)
          const alreadyExists = last.data.some((m) => m._id === message._id);
          if (alreadyExists) return old;
          pages[pages.length - 1] = { ...last, data: [...last.data, message] };
          return { ...old, pages };
        });
      } else {
        // Fallback: invalidate messages to force refetch if no message object
        queryClient.invalidateQueries({ queryKey });
      }

      // Invalidate conversation list to update last_message
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });

      // Increment unread if not the active conversation
      if (conversationId !== selectedConversationId && message?.sender_type !== "agent") {
        incrementUnread(conversationId);
        addNotification({
          title: "Nuevo mensaje",
          body: message?.content ?? "Archivo adjunto",
          conversation_id: conversationId,
        });
      }
    });

    // Conversation status changed
    socket.on("conversation:status_changed", (data: { conversation: Conversation }) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
      queryClient.setQueryData(
        ["conversation", workspaceId, data.conversation._id],
        data.conversation
      );
    });

    // Conversation assigned to this agent
    socket.on("conversation:assigned", (data: { conversation: Conversation }) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
      addNotification({
        title: "Nueva conversación asignada",
        body: `${(data.conversation as any).contact_id?.name ?? "Contacto"} — ${(data.conversation as any).channel_id?.name}`,
        conversation_id: data.conversation._id,
      });
      addToast({
        type: "info",
        message: `Nueva conversación: ${(data.conversation as any).contact_id?.name ?? "Contacto"}`,
        duration: 5000,
      });
    });

    // Conversation resolved/transferred/contact updated
    socket.on("conversation:updated", (data?: { id?: string }) => {
      console.log("[Socket] conversation:updated recibido", data);
      queryClient.refetchQueries({ queryKey: ["conversations", workspaceId] });
      const convId = data?.id ?? selectedConvRef.current;
      if (convId) {
        queryClient.refetchQueries({ queryKey: ["conversation", workspaceId, convId] });
      }
    });

    // Contact updated by bot (collect actions)
    socket.on("contact:updated", (data: { contact_id: string }) => {
      // Refetch inmediato de la lista de conversaciones
      queryClient.refetchQueries({ queryKey: ["conversations", workspaceId] });
      if (data.contact_id) {
        queryClient.invalidateQueries({ queryKey: ["contact", workspaceId, data.contact_id] });
        queryClient.invalidateQueries({ queryKey: ["contacts", workspaceId] });
      }
      // Usar ref para tener el ID actual (evita closure stale)
      const currentConvId = selectedConvRef.current;
      if (currentConvId) {
        queryClient.refetchQueries({ queryKey: ["conversation", workspaceId, currentConvId] });
      }
    });

    // Conversation resolved — sacar de la lista activa
    socket.on("conversation:resolved", (data: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
      // Si era la conversación abierta actualmente, deseleccionar
      if (data.id === selectedConversationId) {
        selectConversation(null);
      }
    });

    // Agent presence update
    socket.on("agent:presence_updated", (presence: AgentPresence) => {
      updateAgentPresence(presence);
    });

    // Bot escalation notification
    socket.on("bot:escalated", (data: { conversation: Conversation }) => {
      addNotification({
        title: "Bot escaló una conversación",
        body: `${(data.conversation as any).contact_id?.name ?? "Contacto"} necesita un agente`,
        conversation_id: data.conversation._id,
      });
      addToast({
        type: "warning",
        message: `Bot escaló: ${(data.conversation as any).contact_id?.name ?? "Contacto"}`,
        duration: 6000,
      });
    });

    return () => {
      disconnectSocket();
      connectedRef.current = false;
    };
  }, [token, workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps
}
