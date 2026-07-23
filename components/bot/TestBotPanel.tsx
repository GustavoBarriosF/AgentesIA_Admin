"use client";

import { useState } from "react";
import { Search, Bot, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { KnowledgeTypeBadge } from "./KnowledgeItemBadge";
import { useKnowledgeSearch } from "@/lib/hooks/useKnowledge";
import type { KnowledgeItem } from "@/types/knowledge";

function ScoreBar({ score }: { score: number | undefined }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  );
}

export function TestBotPanel() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: results, isLoading, isFetching } = useKnowledgeSearch(submitted);

  const handleSearch = () => {
    if (query.trim().length > 2) setSubmitted(query.trim());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Probar Bot</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Escribe una pregunta para ver qué ítems de la base de conocimiento usaría el bot.
        </p>
      </div>

      <div className="px-5 py-4 border-b shrink-0 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="¿Cuáles son sus horarios...?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button size="sm" onClick={handleSearch} disabled={query.trim().length <= 2 || isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {!submitted ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Escribe una pregunta para simular una búsqueda del bot.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-3 space-y-2 animate-pulse">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-full" />
                <div className="h-1.5 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : !results?.length ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Sin resultados para esta pregunta.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Verifica que existan ítems activos en la base de conocimiento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {results.length} ítem{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((item, i) => (
              <ResultCard key={item._id} item={item} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ item, rank }: { item: KnowledgeItem; rank: number }) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-mono">#{rank}</span>
          <KnowledgeTypeBadge type={item.type} />
        </div>
        {item.similarity_score != null && item.similarity_score > 0 && (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {Math.round(item.similarity_score * 100)}% similitud
          </span>
        )}
      </div>
      <p className="text-sm font-medium">{item.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>
      {item.similarity_score != null && item.similarity_score > 0 && (
        <ScoreBar score={item.similarity_score} />
      )}
      {item.tags?.length > 0 && (
        <div className="flex gap-1 flex-wrap pt-0.5">
          {item.tags.map((t) => (
            <span key={t} className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
