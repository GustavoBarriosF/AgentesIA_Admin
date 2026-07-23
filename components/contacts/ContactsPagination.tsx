"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactsPaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function ContactsPagination({
  page,
  total,
  limit,
  onPageChange,
}: ContactsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t text-sm text-muted-foreground">
      <span>
        {total === 0
          ? "Sin resultados"
          : `${from}–${to} de ${total} contactos`}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
            page <= 1
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-muted"
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-2 tabular-nums">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
            page >= totalPages
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-muted"
          )}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
