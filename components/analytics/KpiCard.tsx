import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: "up" | "down" | "neutral";
}

export function KpiCard({ label, value, sub, icon: Icon, iconClassName, trend }: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start gap-4">
      <div className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
        iconClassName ?? "bg-primary/10 text-primary"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-semibold tabular-nums leading-none">{value}</p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        )}
      </div>
    </div>
  );
}
