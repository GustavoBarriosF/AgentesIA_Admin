import { cn } from "@/lib/utils";
import type { TicketStatus, TicketPriority } from "@/types/ticket";

// ── Status Badge ──────────────────────────────────────────────────────────────

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  open:        { label: "Abierto",      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  in_progress: { label: "En progreso",  className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  waiting:     { label: "Esperando",    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  resolved:    { label: "Resuelto",     className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  closed:      { label: "Cerrado",      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

interface TicketStatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
      cfg.className,
      className
    )}>
      {cfg.label}
    </span>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────

const priorityConfig: Record<TicketPriority, { label: string; dot: string }> = {
  low:    { label: "Baja",    dot: "bg-gray-400" },
  medium: { label: "Media",   dot: "bg-blue-500" },
  high:   { label: "Alta",    dot: "bg-orange-500" },
  urgent: { label: "Urgente", dot: "bg-red-500" },
};

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export function TicketPriorityBadge({ priority, className }: TicketPriorityBadgeProps) {
  const cfg = priorityConfig[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── SLA Breach indicator ──────────────────────────────────────────────────────

export function SlaBreach({ className }: { className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      className
    )}>
      SLA
    </span>
  );
}
