"use client";

import { DollarSign, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Lead } from "@/types/lead";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const contact = lead.contact_id;

  return (
    <div
      onClick={onClick}
      className="rounded-lg border bg-card p-3 cursor-pointer hover:shadow-sm hover:border-primary/30 transition-all space-y-2"
    >
      {/* Contact name */}
      <div className="flex items-start gap-2">
        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <User className="h-3.5 w-3.5 text-primary" />
        </div>
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {contact?.name ?? "Sin nombre"}
        </p>
      </div>

      {/* Contact email */}
      {contact?.email && (
        <p className="text-xs text-muted-foreground truncate pl-8">
          {contact.email}
        </p>
      )}

      {/* Value */}
      {lead.value != null && (
        <div className="flex items-center gap-1 pl-8">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium tabular-nums">
            {lead.value.toLocaleString()} {lead.currency}
          </span>
        </div>
      )}

      {/* Tags */}
      {lead.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-8">
          {lead.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
