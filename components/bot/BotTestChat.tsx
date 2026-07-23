"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Cpu, Send, RotateCcw, ChevronDown, AlertTriangle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { BotAgent, BotStep, StepAction } from "@/types/bot";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = "bot" | "user" | "system";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  quickReplies?: string[];
  isEscalation?: boolean;
}

// ─── Decision Bot Engine (frontend) ──────────────────────────────────────────

interface DecisionState {
  botStack: BotAgent[]; // stack de bots activos (para routing)
  stepIndex: number;
}

function matchOption(text: string, options: { label: string }[]) {
  const norm = text.trim().toLowerCase();
  const exact = options.find((o) => o.label.toLowerCase() === norm);
  if (exact) return exact;
  if (/^\d+$/.test(norm)) {
    const idx = parseInt(norm, 10) - 1;
    if (idx >= 0 && idx < options.length) return options[idx];
  }
  return options.find(
    (o) => o.label.toLowerCase().includes(norm) || norm.includes(o.label.toLowerCase())
  ) ?? null;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface BotTestChatProps {
  bots: BotAgent[];
}

export function BotTestChat({ bots }: BotTestChatProps) {
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);

  const [selectedBot, setSelectedBot] = useState<BotAgent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);

  // State for decision bot
  const decisionRef = useRef<DecisionState | null>(null);

  // AI agent chat history for context
  const aiHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), ...msg }]);
  };

  // ── Start a bot session ──────────────────────────────────────────────────
  const startBot = (bot: BotAgent) => {
    setSelectedBot(bot);
    setMessages([]);
    setInput("");
    setLoading(false);
    setEnded(false);
    aiHistoryRef.current = [];

    if (bot.type === "decision_bot") {
      decisionRef.current = { botStack: [bot], stepIndex: 0 };
      sendDecisionStep(bot, 0);
    } else {
      // AI agent: show welcome
      const welcome =
        extractWelcome(bot.system_prompt) ||
        `Hola, soy **${bot.name}**. ¿En qué puedo ayudarte?`;
      addMessage({ role: "bot", content: welcome });
    }
  };

  const reset = () => {
    if (selectedBot) startBot(selectedBot);
  };

  // ── Decision Bot ─────────────────────────────────────────────────────────
  const sendDecisionStep = (bot: BotAgent, stepIndex: number, prefix?: string) => {
    const step = bot.steps?.[stepIndex];
    if (!step) return;
    const content = prefix ? `${prefix}\n\n${step.message}` : step.message;
    addMessage({
      role: "bot",
      content,
      quickReplies: step.options?.map((o) => o.label),
    });
  };

  const handleDecisionInput = async (text: string) => {
    const state = decisionRef.current;
    if (!state) return;

    const currentBot = state.botStack[state.botStack.length - 1];
    const step = currentBot.steps?.[state.stepIndex];
    if (!step) return;

    if (step.options?.length) {
      const matched = matchOption(text, step.options) as typeof step.options[0] | null;
      if (matched) {
        await executeDecisionAction(matched.action, state, currentBot);
      } else if (step.action) {
        // Opción no reconocida → usar acción de fallback del paso
        await executeDecisionAction(step.action, state, currentBot);
      } else {
        sendDecisionStep(
          currentBot,
          state.stepIndex,
          "No reconocí tu respuesta. Por favor elige una opción:"
        );
      }
    } else if (step.action) {
      // Sin opciones → ejecutar acción automática del paso
      await executeDecisionAction(step.action, state, currentBot);
    } else {
      // Sin opciones ni acción → avanzar al siguiente paso
      const next = state.stepIndex + 1;
      if (next < currentBot.steps.length) {
        state.stepIndex = next;
        sendDecisionStep(currentBot, next);
      } else {
        escalate();
      }
    }
  };

  const executeDecisionAction = async (
    action: StepAction,
    state: DecisionState,
    currentBot: BotAgent
  ) => {
    switch (action.type) {
      case "next_step": {
        const next = state.stepIndex + 1;
        if (next < currentBot.steps.length) {
          state.stepIndex = next;
          sendDecisionStep(currentBot, next);
        } else {
          escalate();
        }
        break;
      }
      case "goto_step": {
        const idx = action.goto_step_index ?? 0;
        state.stepIndex = idx;
        sendDecisionStep(currentBot, idx);
        break;
      }
      case "route_bot": {
        const target = bots.find((b) => b._id === action.target_bot_id && b.type === "decision_bot");
        if (!target) { escalate("Bot destino no encontrado"); break; }
        state.botStack.push(target);
        state.stepIndex = 0;
        addMessage({ role: "system", content: `Redirigiendo a **${target.name}**…` });
        sendDecisionStep(target, 0);
        break;
      }
      case "route_agent": {
        const target = bots.find((b) => b._id === action.target_agent_id && b.type === "ai_agent");
        if (!target) { escalate("Agente destino no encontrado"); break; }
        setSelectedBot(target);
        aiHistoryRef.current = [];
        addMessage({
          role: "system",
          content: `Transferido al agente de IA **${target.name}**`,
        });
        const welcome =
          extractWelcome(target.system_prompt) ||
          `Hola, soy **${target.name}**. ¿En qué puedo ayudarte?`;
        addMessage({ role: "bot", content: welcome });
        // Switch to AI mode
        decisionRef.current = null;
        break;
      }
      case "escalate_human":
        escalate();
        break;
      case "end":
        if (action.end_message) addMessage({ role: "bot", content: action.end_message });
        addMessage({
          role: "system",
          content: "La conversación ha finalizado.",
        });
        setEnded(true);
        break;
    }
  };

  // ── AI Agent ──────────────────────────────────────────────────────────────
  const handleAiInput = async (text: string) => {
    if (!selectedBot || !workspaceId) return;
    setLoading(true);
    try {
      const res = await api.post<{ response: string; should_escalate: boolean }>(
        `/api/${workspaceId}/bots/${selectedBot._id}/test`,
        { message: text, history: aiHistoryRef.current }
      );
      aiHistoryRef.current.push({ role: "user", content: text });
      aiHistoryRef.current.push({ role: "assistant", content: res.data.response });
      addMessage({ role: "bot", content: res.data.response });
      if (res.data.should_escalate) escalate();
    } catch (err: any) {
      // Extraer el mensaje real del error del backend
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Error desconocido";
      const status = err?.response?.status;
      console.error("[BotTestChat] Error llamando al agente:", { status, serverMsg, err });
      addMessage({
        role: "system",
        content: `⚠️ Error ${status ? `(${status})` : ""}: ${serverMsg}`,
        isEscalation: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const escalate = (reason?: string) => {
    addMessage({
      role: "system",
      content: reason ?? "El bot escalaría esta conversación a un **agente humano**.",
      isEscalation: true,
    });
    setEnded(true);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || ended) return;
    setInput("");
    addMessage({ role: "user", content: msg });

    // Pequeño delay para que React renderice la burbuja de usuario antes de responder
    await new Promise((r) => setTimeout(r, 120));

    if (decisionRef.current) {
      await handleDecisionInput(msg);
    } else if (selectedBot?.type === "ai_agent") {
      await handleAiInput(msg);
    }
  };

  const decisionBots = bots.filter((b) => b.type === "decision_bot");
  const aiAgents = bots.filter((b) => b.type === "ai_agent");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          {selectedBot ? (
            <>
              {selectedBot.avatar ? (
                <img src={selectedBot.avatar} className="h-7 w-7 rounded-full object-cover" alt="" />
              ) : selectedBot.type === "decision_bot" ? (
                <Bot className="h-4 w-4 text-blue-500" />
              ) : (
                <Cpu className="h-4 w-4 text-purple-500" />
              )}
              <span className="text-sm font-semibold">{selectedBot.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedBot.type === "decision_bot"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              }`}>
                {selectedBot.type === "decision_bot" ? "Bot de Decisión" : "Agente de IA"}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Selecciona un bot para probar</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {selectedBot && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-medium border border-border hover:bg-muted transition-colors outline-none">
              {selectedBot ? "Cambiar bot" : "Seleccionar"}
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {decisionBots.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Bots de Decisión</div>
                  {decisionBots.map((b) => (
                    <DropdownMenuItem key={b._id} onClick={() => startBot(b)} className="gap-2">
                      <Bot className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="truncate">{b.name}</span>
                      {!b.active && <span className="ml-auto text-xs text-muted-foreground">Inactivo</span>}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              {aiAgents.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-1">Agentes de IA</div>
                  {aiAgents.map((b) => (
                    <DropdownMenuItem key={b._id} onClick={() => startBot(b)} className="gap-2">
                      <Cpu className="h-4 w-4 text-purple-500 shrink-0" />
                      <span className="truncate">{b.name}</span>
                      {!b.active && <span className="ml-auto text-xs text-muted-foreground">Inactivo</span>}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              {bots.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">Sin bots creados</div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Chat area */}
      {!selectedBot ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <Bot className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium">Simulador de conversación</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Selecciona un bot o agente de IA para probar cómo respondería a los usuarios.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} botName={selectedBot.name} botAvatar={selectedBot.avatar} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies — solo si el ÚLTIMO mensaje es del bot y tiene opciones */}
          {!ended && !loading && (() => {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.role !== "bot" || !lastMsg?.quickReplies?.length) return null;
            return (
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {lastMsg.quickReplies.map((label) => (
                  <button
                    key={label}
                    onClick={() => handleSend(label)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Input */}
          <div className="px-4 py-3 border-t shrink-0">
            {ended ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-xs text-muted-foreground">Conversación finalizada</p>
                <button onClick={reset} className="text-xs text-primary hover:underline">
                  Reiniciar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={loading}
                  className="h-9"
                />
                <Button
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChatBubble({
  message,
  botName,
  botAvatar,
}: {
  message: ChatMessage;
  botName: string;
  botAvatar?: string | null;
}) {
  if (message.role === "system") {
    return (
      <div className={`flex items-center justify-center gap-1.5 ${message.isEscalation ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
        {message.isEscalation && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
        <p className="text-xs text-center" dangerouslySetInnerHTML={{ __html: message.content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
      </div>
    );
  }

  if (message.role === "user") {
    return (
      <div className="flex items-end justify-end gap-2">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3.5 py-2 text-sm">
          {message.content}
        </div>
        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Bot message
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
        {botAvatar ? (
          <img src={botAvatar} alt={botName} className="h-full w-full object-cover" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function extractWelcome(systemPrompt?: string): string | null {
  if (!systemPrompt) return null;
  const match = systemPrompt.match(/BIENVENIDA:\s*(.+)/i);
  return match?.[1]?.trim() || null;
}
