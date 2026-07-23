"use client";

import { useState } from "react";
import { Bot, BookOpen, Plus, Cpu } from "lucide-react";
import { useKnowledgeAll } from "@/lib/hooks/useKnowledge";
import { useBots, useCreateBot } from "@/lib/hooks/useBots";
import { KnowledgeList } from "@/components/bot/KnowledgeList";
import { KnowledgeForm } from "@/components/bot/KnowledgeForm";
import { BotTestChat } from "@/components/bot/BotTestChat";
import { BotEditorPanel } from "@/components/bot/BotEditorPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KnowledgeItem } from "@/types/knowledge";
import type { BotAgent } from "@/types/bot";

type Tab = "bots" | "knowledge";
type RightPanel = "bot_editor" | "knowledge_form" | "test";

export default function BotPage() {
  const [activeTab, setActiveTab] = useState<Tab>("bots");

  // Bots & agents
  const { data: bots = [], isLoading: loadingBots } = useBots();
  const createBot = useCreateBot();
  const [selectedBot, setSelectedBot] = useState<BotAgent | null>(null);

  // Knowledge
  const { data: knowledgeItems = [], isLoading: loadingKnowledge } = useKnowledgeAll();
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeItem | null>(null);
  const [knowledgeFormMode, setKnowledgeFormMode] = useState<"new" | "edit">("edit");

  const [rightPanel, setRightPanel] = useState<RightPanel>("test");

  const handleSelectBot = (bot: BotAgent) => {
    setSelectedBot(bot);
    setRightPanel("bot_editor");
  };

  const handleCreateBot = async (type: BotAgent["type"]) => {
    const name = type === "decision_bot" ? "Nuevo Bot" : "Nuevo Agente de IA";
    const bot = await createBot.mutateAsync({ name, type });
    setSelectedBot(bot);
    setRightPanel("bot_editor");
  };

  const handleSelectKnowledge = (item: KnowledgeItem) => {
    setSelectedKnowledge(item);
    setKnowledgeFormMode("edit");
    setRightPanel("knowledge_form");
  };

  const handleNewKnowledge = () => {
    setSelectedKnowledge(null);
    setKnowledgeFormMode("new");
    setRightPanel("knowledge_form");
  };

  const handleKnowledgeSaved = () => {
    setSelectedKnowledge(null);
    setRightPanel("test");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Bot e IA</h1>
          </div>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-lg border p-0.5 bg-muted/50">
            <button
              onClick={() => setActiveTab("bots")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-colors ${
                activeTab === "bots"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              Bots y Agentes
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition-colors ${
                activeTab === "knowledge"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Base de conocimiento
            </button>
          </div>
        </div>

        {/* Actions */}
        {activeTab === "bots" ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors outline-none disabled:opacity-50" disabled={createBot.isPending}>
              <Plus className="h-4 w-4" />
              Crear
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreateBot("decision_bot")}>
                <Bot className="h-4 w-4 mr-2 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Bot de Decisión</p>
                  <p className="text-xs text-muted-foreground">Árbol de pasos con opciones</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateBot("ai_agent")}>
                <Cpu className="h-4 w-4 mr-2 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Agente de IA</p>
                  <p className="text-xs text-muted-foreground">Claude con base de conocimiento</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={handleNewKnowledge}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo ítem
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 border-r overflow-hidden flex flex-col">
          {activeTab === "bots" ? (
            <BotList
              bots={bots}
              isLoading={loadingBots}
              selected={selectedBot}
              onSelect={handleSelectBot}
            />
          ) : (
            <KnowledgeList
              items={knowledgeItems}
              isLoading={loadingKnowledge}
              selected={selectedKnowledge}
              onSelect={handleSelectKnowledge}
              onNew={handleNewKnowledge}
            />
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-hidden">
          {rightPanel === "bot_editor" && selectedBot ? (
            <BotEditorPanel
              key={selectedBot._id}
              bot={selectedBot}
              allBots={bots}
              onClose={() => {
                setSelectedBot(null);
                setRightPanel("test");
              }}
            />
          ) : rightPanel === "knowledge_form" ? (
            <KnowledgeForm
              item={knowledgeFormMode === "edit" ? selectedKnowledge : null}
              onSaved={handleKnowledgeSaved}
              onDeleted={handleKnowledgeSaved}
            />
          ) : (
            <BotTestChat bots={bots} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bot list (inline, no necesita archivo propio) ───────────────────────────

function BotList({
  bots,
  isLoading,
  selected,
  onSelect,
}: {
  bots: BotAgent[];
  isLoading: boolean;
  selected: BotAgent | null;
  onSelect: (b: BotAgent) => void;
}) {
  const decisionBots = bots.filter((b) => b.type === "decision_bot");
  const aiAgents = bots.filter((b) => b.type === "ai_agent");

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Bot className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Sin bots creados</p>
        <p className="text-xs text-muted-foreground mt-1">
          Crea un Bot de Decisión o un Agente de IA para comenzar.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1 p-2 space-y-4">
      {decisionBots.length > 0 && (
        <section>
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Bots de Decisión
          </p>
          <div className="space-y-0.5">
            {decisionBots.map((bot) => (
              <BotListItem
                key={bot._id}
                bot={bot}
                isSelected={selected?._id === bot._id}
                onClick={() => onSelect(bot)}
              />
            ))}
          </div>
        </section>
      )}
      {aiAgents.length > 0 && (
        <section>
          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Agentes de IA
          </p>
          <div className="space-y-0.5">
            {aiAgents.map((bot) => (
              <BotListItem
                key={bot._id}
                bot={bot}
                isSelected={selected?._id === bot._id}
                onClick={() => onSelect(bot)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BotListItem({
  bot,
  isSelected,
  onClick,
}: {
  bot: BotAgent;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
      }`}
    >
      {bot.avatar ? (
        <img
          src={bot.avatar}
          alt={bot.name}
          className="h-8 w-8 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-muted-foreground/10 flex items-center justify-center shrink-0">
          {bot.type === "decision_bot" ? (
            <Bot className="h-4 w-4 text-blue-500" />
          ) : (
            <Cpu className="h-4 w-4 text-purple-500" />
          )}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{bot.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {bot.type === "decision_bot"
            ? `${bot.steps?.length ?? 0} paso${(bot.steps?.length ?? 0) !== 1 ? "s" : ""}`
            : bot.provider === "ollama"
              ? `⚡ ${bot.model ?? "Ollama"}`
              : bot.model
                ? `✦ ${bot.model.replace("claude-", "").replace(/-\d+.*/, "")}`
                : "IA (workspace)"}
        </p>
      </div>
      {!bot.active && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
          Inactivo
        </span>
      )}
    </button>
  );
}
