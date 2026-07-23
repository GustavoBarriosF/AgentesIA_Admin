import { Badge } from "@/components/ui/badge";
import type { KnowledgeItem } from "@/types/knowledge";

const TYPE_CONFIG: Record<
  KnowledgeItem["type"],
  { label: string; className: string }
> = {
  faq:         { label: "FAQ",       className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  document:    { label: "Documento", className: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  flow:        { label: "Flujo",     className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  snippet:     { label: "Snippet",   className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  spreadsheet: { label: "Excel",     className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  protocol:    { label: "Protocolo", className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
};

export function KnowledgeTypeBadge({ type }: { type: KnowledgeItem["type"] }) {
  const cfg = TYPE_CONFIG[type] ?? { label: type, className: "" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function KnowledgeActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
      Inactivo
    </span>
  );
}
