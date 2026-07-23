"use client";

import { useSocket } from "@/lib/hooks/useSocket";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocket();
  return <>{children}</>;
}
