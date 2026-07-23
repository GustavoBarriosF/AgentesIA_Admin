"use client";

import { useState } from "react";
import { Search, Plus, BarChart2, ThumbsUp, ThumbsDown, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { KnowledgeTypeBadge, KnowledgeActiveBadge } from "./KnowledgeItemBadge";
import { useUpdateKnowledgeItem } from "@/lib/hooks/useKnowledge";
import type { KnowledgeItem } from "@/types/knowledge";

const TYPE_FILTERS = [
  { value: "all",      label: "Todos" },
  { value: "faq",      label: "FAQ" },
  { value: "document", label: "Documento" },
  { value: "flow",     label: "Flujo" },
  { value: "snippet",  label: "Snippet" },
] as const;

interface KnowledgeListProps {
  items: KnowledgeItem[];
  isLoading: boolean;
  selected: KnowledgeItem | null;
  onSelect: (item: KnowledgeItem) => void;
  onNew: () => void;
}

export function KnowledgeList({ items, isLoading, selected, onSelect, onNew }: KnowledgeListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const updateItem = useUpdateKnowledgeItem();

  const filtered = items.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleToggleActive = (e: React.MouseEvent, item: KnowledgeItem) => {
    e.stopPropagation();
    updateItem.mutate({ itemId: item._id, active: !item.active });
  };

  return (
    <div className="flex flex-col h-full border-r">
      {/* Search + add */}
      <div className="p-3 space-y-2 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-8 h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={onNew}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {/* Type filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-2.5 py-0.5 rounded-full text-xs transition-colors ${
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-3 py-1.5 border-b">
        <p className="text-xs text-muted-foreground">{filtered.length} ítems</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-sm text-muted-foreground">Sin ítems</p>
            <Button variant="link" size="sm" onClick={onNew} className="mt-1">
              Crear primero
            </Button>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id}
              onClick={() => onSelect(item)}
              className={`px-3 py-2.5 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                selected?._id === item._id ? "bg-muted" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${!item.active ? "text-muted-foreground" : ""}`}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <KnowledgeTypeBadge type={item.type} />
                    {!item.active && <KnowledgeActiveBadge active={false} />}
                    {/* Estado RAG */}
                    {item.rag_indexed
                      ? (
                        <span
                          title={`Indexado en Qdrant · ${item.rag_chunks ?? 0} chunks`}
                          className="flex items-center gap-0.5 text-[10px] text-green-700"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          RAG
                        </span>
                      ) : (
                        <span
                          title="Pendiente de indexar en Qdrant"
                          className="flex items-center gap-0.5 text-[10px] text-amber-600"
                        >
                          <Clock className="h-2.5 w-2.5" />
                          Pendiente
                        </span>
                      )
                    }
                  </div>
                </div>
                <Switch
                  checked={item.active}
                  onClick={(e) => handleToggleActive(e, item)}
                  className="shrink-0 mt-0.5"
                />
              </div>
              {/* Usage stats */}
              {item.usage_count > 0 && (
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <BarChart2 className="h-3 w-3" /> {item.usage_count}
                  </span>
                  {item.helpful_count > 0 && (
                    <span className="flex items-center gap-0.5 text-green-600">
                      <ThumbsUp className="h-3 w-3" /> {item.helpful_count}
                    </span>
                  )}
                  {item.unhelpful_count > 0 && (
                    <span className="flex items-center gap-0.5 text-rose-600">
                      <ThumbsDown className="h-3 w-3" /> {item.unhelpful_count}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
