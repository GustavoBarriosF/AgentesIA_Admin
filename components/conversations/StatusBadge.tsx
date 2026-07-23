import { cn } from "@/lib/utils";
import type { ConversationStatus } from "@/types/conversation";

const statusConfig: Record<
  ConversationStatus,
  { label: string; className: string }
> = {
  open: { label: "Abierta", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  bot: { label: "Bot", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  assigned: { label: "Asignada", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  resolved: { label: "Resuelta", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  abandoned: { label: "Abandonada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

interface StatusBadgeProps {
  status: ConversationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
