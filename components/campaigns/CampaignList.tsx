"use client";

import { useState } from "react";
import { Plus, Search, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import { useCampaigns, type Campaign, type CampaignStatus } from "@/lib/hooks/useCampaigns";
import { cn } from "@/lib/utils";

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp:           "📱",
  telegram:           "✈️",
  email:              "📧",
  facebook_messenger: "💬",
  instagram_dm:       "📸",
};

const TYPE_LABELS: Record<string, string> = {
  immediate: "Inmediata",
  drip:      "Drip",
  trigger:   "Trigger",
};

interface CampaignListProps {
  selectedId:  string | null;
  onSelect:    (id: string) => void;
  onCreate:    () => void;
}

export function CampaignList({ selectedId, onSelect, onCreate }: CampaignListProps) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setFilter] = useState<CampaignStatus | "">("");

  const { data, isLoading } = useCampaigns(statusFilter || undefined);
  const campaigns = data?.campaigns ?? [];

  const filtered = search
    ? campaigns.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : campaigns;

  return (
    <div className="flex flex-col h-full border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Campañas</h2>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1" />Nueva
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Buscar campaña..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Status filters */}
        <div className="flex gap-1 flex-wrap">
          {(["", "running", "draft", "scheduled", "paused", "completed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "" ? "Todas" : s === "running" ? "En curso" : s === "draft" ? "Borrador"
                : s === "scheduled" ? "Prog." : s === "paused" ? "Pausada" : "Completada"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
            <Megaphone className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Sin campañas</p>
            <p className="text-xs mt-1">Crea tu primera campaña de marketing</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filtered.map((c) => (
              <CampaignItem
                key={c._id}
                campaign={c}
                isSelected={selectedId === c._id}
                onClick={() => onSelect(c._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignItem({ campaign: c, isSelected, onClick }: {
  campaign: Campaign; isSelected: boolean; onClick: () => void;
}) {
  const progress = c.stats.total > 0
    ? Math.round((c.stats.sent / c.stats.total) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg p-3 transition-colors",
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50 border border-transparent"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg shrink-0 mt-0.5">{CHANNEL_ICONS[c.channel_type] ?? "📣"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium truncate flex-1">{c.name}</p>
            <CampaignStatusBadge status={c.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {TYPE_LABELS[c.type]} · {new Date(c.createdAt).toLocaleDateString("es-CO")}
          </p>
          {(c.status === "running" || c.status === "completed") && c.stats.total > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                <span>{c.stats.sent.toLocaleString()} enviados</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
