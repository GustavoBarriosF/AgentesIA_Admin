import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getToken();
    socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinWorkspace(workspaceId: string): void {
  getSocket().emit("workspace:join", { workspaceId });
}

export function leaveWorkspace(workspaceId: string): void {
  getSocket().emit("workspace:leave", { workspaceId });
}

export function joinConversation(conversationId: string): void {
  getSocket().emit("conversation:join", { conversationId });
}

export function leaveConversation(conversationId: string): void {
  getSocket().emit("conversation:leave", { conversationId });
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("trivox-auth");
    if (!raw) return null;
    return JSON.parse(raw)?.state?.token ?? null;
  } catch {
    return null;
  }
}
