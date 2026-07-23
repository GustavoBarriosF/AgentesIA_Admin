"use client";

import { useState, useEffect } from "react";
import {
  Settings, Bot, Palette, Users, Sliders,
  Loader2, Save, UserPlus, Shield, ChevronDown,
  Check, X, MessageSquare, Plug, Plus, CreditCard,
  TrendingUp, ExternalLink, AlertCircle, Gift,
  Cpu, RefreshCw, Zap, Database,
  Trash2, DollarSign, Eye, EyeOff, Copy,
  Building2, Pencil, KeyRound,
} from "lucide-react";
import {
  useWorkspacePlan,
  useWorkspaceInvoices,
  useCheckout,
  useBillingPortal,
  useApplyCoupon,
} from "@/lib/hooks/useBilling";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useWorkspace,
  useUpdateWorkspace,
  useWorkspaceMembers,
  useCreateMember,
  useInviteMember,
  useUpdateMember,
} from "@/lib/hooks/useWorkspace";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/lib/hooks/useDepartments";
import { useBots } from "@/lib/hooks/useBots";
import {
  useAIProvider,
  useAvailableModels,
  useUpdateAIProvider,
  useReindexKnowledge,
  type AIProviderType,
} from "@/lib/hooks/useAIProviders";
import {
  useChannels,
  useCreateChannel,
  useUpdateChannel,
  useToggleChannel,
  useVerifyMetaToken,
  useVerifyEmailCredentials,
  type Channel,
  type ChannelType,
} from "@/lib/hooks/useChannels";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { Workspace } from "@/types/workspace";
import {
  usePaymentGateways,
  useSavePaymentGateway,
  useVerifyPaymentGateway,
  useDeletePaymentGateway,
  type GatewayProvider,
} from "@/lib/hooks/usePaymentGateways";
import { ERPIntegrationsTab } from "@/components/settings/ERPIntegrationsTab";
import { BaileysConnectPanel, BaileysRiskWarning } from "@/components/settings/BaileysPanel";
import { WebchatDesigner } from "@/components/webchat/WebchatDesigner";

type Section = "general" | "bot" | "branding" | "behavior" | "channels" | "integrations" | "team" | "billing";

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "general",      label: "General",        icon: Settings      },
  { id: "bot",          label: "Bot e IA",        icon: Bot           },
  { id: "branding",     label: "Branding",        icon: Palette       },
  { id: "behavior",     label: "Comportamiento",  icon: Sliders       },
  { id: "channels",     label: "Canales",         icon: MessageSquare },
  { id: "integrations", label: "Integraciones",   icon: Plug          },
  { id: "team",         label: "Equipo",          icon: Users         },
  { id: "billing",      label: "Facturación",     icon: CreditCard    },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("general");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar nav */}
      <nav className="w-52 shrink-0 border-r p-3 space-y-0.5">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Configuración
        </p>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeSection === id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === "general"      && <GeneralSection />}
        {activeSection === "bot"          && <BotSection />}
        {activeSection === "branding"     && <BrandingSection />}
        {activeSection === "behavior"     && <BehaviorSection />}
        {activeSection === "channels"     && <ChannelsSection />}
        {activeSection === "integrations" && <IntegrationsSection />}
        {activeSection === "team"         && <TeamSection />}
        {activeSection === "billing"      && <BillingSection />}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function SaveButton({ loading }: { loading: boolean }) {
  return (
    <Button type="submit" size="sm" disabled={loading}>
      {loading
        ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        : <Save className="h-4 w-4 mr-1.5" />}
      Guardar cambios
    </Button>
  );
}

function useSave() {
  const { data: workspace, isLoading } = useWorkspace();
  const update = useUpdateWorkspace();

  const save = async (patch: Parameters<typeof update.mutateAsync>[0]) => {
    try {
      await update.mutateAsync(patch);
      toast.success("Cambios guardados");
    } catch {
      toast.error("No se pudo guardar");
    }
  };

  return { workspace, isLoading, save, saving: update.isPending };
}

function SectionSkeleton() {
  return (
    <div className="p-8 max-w-lg space-y-5">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      <Skeleton className="h-9 w-28" />
    </div>
  );
}

// ─── General ─────────────────────────────────────────────────────────────────

function GeneralSection() {
  const { workspace, isLoading, save, saving } = useSave();
  const [name, setName] = useState("");

  useEffect(() => {
    if (workspace) setName(workspace.name);
  }, [workspace?._id]);

  if (isLoading) return <SectionSkeleton />;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save({ name }); }}
      className="p-8 max-w-lg space-y-6"
    >
      <SectionHeader title="General" description="Información básica del workspace." />

      <div className="space-y-1.5">
        <Label>Nombre del workspace</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi Empresa" />
      </div>

      <div className="space-y-1.5">
        <Label>ID del workspace</Label>
        <Input
          value={workspace?._id ?? ""}
          readOnly
          className="font-mono text-xs text-muted-foreground bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Solo lectura — se usa en integraciones de API.
        </p>
      </div>

      <SaveButton loading={saving} />
    </form>
  );
}

// ─── Bot e IA ─────────────────────────────────────────────────────────────────

function BotSection() {
  const { workspace, isLoading, save, saving } = useSave();
  const { data: bots = [] } = useBots();

  const [botEnabled, setBotEnabled]   = useState(true);
  const [entryBotId, setEntryBotId]   = useState("");
  const [maxBotTurns, setMaxBotTurns] = useState(5);

  useEffect(() => {
    if (!workspace) return;
    setBotEnabled(workspace.settings.bot_enabled ?? true);
    setEntryBotId(workspace.settings.entry_bot_id ?? "");
    setMaxBotTurns(workspace.settings.max_bot_turns ?? 5);
  }, [workspace?._id]);

  if (isLoading) return <SectionSkeleton />;

  const activeBots    = bots.filter((b) => b.active);
  const decisionBots  = activeBots.filter((b) => b.type === "decision_bot");
  const aiAgents      = activeBots.filter((b) => b.type === "ai_agent");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({
          settings: {
            ...workspace?.settings,
            bot_enabled:   botEnabled,
            entry_bot_id:  entryBotId || null,
            max_bot_turns: maxBotTurns,
          },
        });
      }}
      className="p-8 max-w-lg space-y-6"
    >
      <SectionHeader
        title="Bot e IA"
        description="Configura qué bot responde las conversaciones nuevas y cómo se comporta."
      />

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Bot activado</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cuando está activo, el bot responde automáticamente las conversaciones nuevas.
          </p>
        </div>
        <Switch checked={botEnabled} onCheckedChange={setBotEnabled} />
      </div>

      {botEnabled && (
        <>
          <Separator />

          <div className="space-y-1.5">
            <Label>Bot de entrada</Label>
            <p className="text-xs text-muted-foreground">
              El bot que recibe cada conversación nueva. Si es un Bot de Decisión muestra
              su menú de opciones; si es un Agente de IA responde directamente.
            </p>

            {activeBots.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No hay bots activos. Crea uno en la sección{" "}
                  <span className="font-medium">Bot e IA</span>.
                </p>
              </div>
            ) : (
              <Select value={entryBotId} onValueChange={(v) => setEntryBotId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin bot — ir directo a agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <span className="text-muted-foreground">Sin bot — ir directo a agentes</span>
                  </SelectItem>

                  {decisionBots.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Bots de Decisión
                      </div>
                      {decisionBots.map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          <div className="flex items-center gap-2">
                            {b.avatar
                              ? <img src={b.avatar} className="h-5 w-5 rounded-full object-cover" alt="" />
                              : <Bot className="h-4 w-4 text-blue-500" />}
                            {b.name}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {aiAgents.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Agentes de IA
                      </div>
                      {aiAgents.map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          <div className="flex items-center gap-2">
                            {b.avatar
                              ? <img src={b.avatar} className="h-5 w-5 rounded-full object-cover" alt="" />
                              : <Bot className="h-4 w-4 text-purple-500" />}
                            {b.name}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Máximo de turnos del bot</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={maxBotTurns}
              onChange={(e) => setMaxBotTurns(Number(e.target.value))}
              className="w-28"
            />
            <p className="text-xs text-muted-foreground">
              Límite global antes de escalar a agente humano. Los Agentes de IA tienen su
              propio límite configurable que tiene precedencia.
            </p>
          </div>
        </>
      )}

      <SaveButton loading={saving} />
    </form>
  );
}

// ─── AI Provider ─────────────────────────────────────────────────────────────

const PROVIDER_OPTIONS: { id: AIProviderType; label: string; icon: string; desc: string; keyLabel: string; keyUrl: string }[] = [
  {
    id: "claude",
    label: "Claude (Anthropic)",
    icon: "✦",
    desc: "Potente IA en la nube",
    keyLabel: "Anthropic API Key",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "openai",
    label: "OpenAI (GPT)",
    icon: "⬡",
    desc: "GPT-4o y modelos GPT",
    keyLabel: "OpenAI API Key",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "gemini",
    label: "Google Gemini",
    icon: "◈",
    desc: "Gemini 2.0 Flash y Pro",
    keyLabel: "Gemini API Key",
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "groq",
    label: "Groq",
    icon: "▲",
    desc: "LLaMA y Mixtral ultrarrápidos",
    keyLabel: "Groq API Key",
    keyUrl: "https://console.groq.com/keys",
  },
  {
    id: "ollama",
    label: "Ollama (Local)",
    icon: "⚡",
    desc: "IA privada en tu servidor",
    keyLabel: "",
    keyUrl: "",
  },
];

function AIProviderSection() {
  const { data: config, isLoading: loadingConfig } = useAIProvider();
  const { data: models, isLoading: loadingModels } = useAvailableModels();
  const update  = useUpdateAIProvider();
  const reindex = useReindexKnowledge();

  const [provider,   setProvider]   = useState<AIProviderType>("claude");
  const [model,      setModel]      = useState("");
  const [apiKey,     setApiKey]     = useState("");
  const [showKey,    setShowKey]    = useState(false);
  const [ollamaUrl,  setOllamaUrl]  = useState("");
  const [embedModel, setEmbedModel] = useState("llama3.2:1b");

  useEffect(() => {
    if (!config) return;
    setProvider(config.provider    ?? "claude");
    setModel(config.model          ?? "");
    setEmbedModel(config.embed_model ?? "llama3.2:1b");
    setOllamaUrl(config.ollama_url ?? "");
    // No precargamos la API key — el usuario debe escribirla explícitamente si quiere cambiarla
    setApiKey("");
  }, [config?.provider, config?.model]);

  if (loadingConfig) return <SectionSkeleton />;

  const claudeModels = models?.claude ?? [];
  const openaiModels = models?.openai ?? [];
  const geminiModels = models?.gemini ?? [];
  const groqModels   = models?.groq   ?? [];
  const ollamaModels = models?.ollama ?? [];
  const ollamaAvailable = models?.ollama_available ?? false;
  const qdrantAvailable = models?.qdrant_available ?? false;

  const currentModels = (() => {
    switch (provider) {
      case "openai":  return openaiModels;
      case "gemini":  return geminiModels;
      case "groq":    return groqModels;
      case "ollama":  return ollamaModels;
      default:        return claudeModels;
    }
  })();

  const needsApiKey  = provider !== "ollama";
  const keyConfigured = config?.api_key_configured ?? false;
  const currentOption = PROVIDER_OPTIONS.find((p) => p.id === provider)!;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload: Parameters<typeof update.mutate>[0] = {
      provider,
      model,
      embed_model: embedModel,
    };
    // Solo enviar api_key si el usuario escribió algo
    if (apiKey.trim()) payload.api_key = apiKey.trim();
    if (provider === "ollama") payload.ollama_url = ollamaUrl.trim() || undefined;
    update.mutate(payload);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <p className="text-sm font-semibold">Proveedor de IA</p>
      <p className="text-xs text-muted-foreground -mt-4">
        Elige el motor de IA y configura su API key. Cada workspace usa sus propias credenciales.
      </p>

      {/* Status badges */}
      <div className="flex gap-2 flex-wrap">
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
          ollamaAvailable
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-muted text-muted-foreground border-border"
        }`}>
          <Cpu className="h-3 w-3" />
          Ollama {ollamaAvailable ? "conectado" : "desconectado"}
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
          qdrantAvailable
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-muted text-muted-foreground border-border"
        }`}>
          <Database className="h-3 w-3" />
          Qdrant {qdrantAvailable ? "conectado" : "desconectado"}
        </div>
      </div>

      {/* Provider selector */}
      <div className="space-y-3">
        <Label>Proveedor</Label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDER_OPTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setProvider(p.id);
                setModel("");
                setApiKey("");
              }}
              className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                provider === p.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="text-xs text-muted-foreground">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* API Key (para Claude, OpenAI y Gemini) */}
      {needsApiKey && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            {currentOption.keyLabel}
            {keyConfigured && provider === config?.provider && (
              <span className="text-xs font-normal text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                ✓ Configurada
              </span>
            )}
          </Label>
          <div className="flex gap-2">
            <Input
              type={showKey ? "text" : "password"}
              placeholder={keyConfigured && provider === config?.provider ? "••••••••  (dejar vacío para no cambiar)" : "Pegar API key aquí..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowKey(!showKey)}
              className="shrink-0"
            >
              {showKey ? "Ocultar" : "Ver"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Obtener en{" "}
            <a href={currentOption.keyUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
              {currentOption.keyUrl}
            </a>
            . La clave se guarda de forma segura y nunca se muestra después de guardada.
          </p>
        </div>
      )}

      {/* Ollama URL personalizada */}
      {provider === "ollama" && (
        <div className="space-y-1.5">
          <Label>URL del servidor Ollama</Label>
          <Input
            placeholder="http://localhost:11434  (dejar vacío para usar el del servidor)"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Si tu servidor Ollama está en otra dirección, ingrésala aquí. Si está en el mismo servidor que el backend déjalo vacío.
          </p>
        </div>
      )}

      {/* Model selector */}
      <div className="space-y-1.5">
        <Label>Modelo de chat</Label>
        {loadingModels ? (
          <Skeleton className="h-9 w-full" />
        ) : currentModels.length === 0 ? (
          <div className="rounded-lg border border-dashed p-3 text-center">
            <p className="text-sm text-muted-foreground">
              {provider === "ollama" && !ollamaAvailable
                ? "Ollama no disponible. Verifica la conexión al servidor."
                : "No hay modelos disponibles."}
            </p>
          </div>
        ) : (
          <Select value={model} onValueChange={(v) => setModel(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un modelo" />
            </SelectTrigger>
            <SelectContent>
              {currentModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{m.name}</span>
                    {m.description && (
                      <span className="text-xs text-muted-foreground">{m.description}</span>
                    )}
                    {m.size && (
                      <span className="text-xs text-muted-foreground">
                        {(m.size / 1e9).toFixed(1)} GB
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          Modelo usado para conversaciones de todos los Agentes de IA del workspace
          (puede sobreescribirse por agente).
        </p>
      </div>

      {/* Embed model (solo si Ollama disponible) */}
      {ollamaAvailable && (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Modelo de embeddings (RAG)
          </Label>
          <Select value={embedModel} onValueChange={(v) => setEmbedModel(v ?? "")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ollamaModels.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                  {m.size && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {(m.size / 1e9).toFixed(1)} GB
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Modelo Ollama para convertir tus documentos en vectores semánticos.
            Recomendado: <span className="font-mono font-medium">llama3.2:1b</span> (rápido y ligero).
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={update.isPending || !model}>
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar cambios
        </Button>

        {qdrantAvailable && ollamaAvailable && (
          <Button
            type="button"
            variant="outline"
            disabled={reindex.isPending}
            onClick={() => reindex.mutate()}
          >
            {reindex.isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <RefreshCw className="h-4 w-4 mr-2" />}
            Re-indexar documentos
          </Button>
        )}
      </div>

      {qdrantAvailable && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">RAG activo:</span> Los documentos PDF que subas serán
            automáticamente divididos en fragmentos, convertidos a vectores y guardados en Qdrant.
            El bot buscará el contexto más relevante antes de responder.
          </p>
        </div>
      )}
    </form>
  );
}

// ─── Branding ─────────────────────────────────────────────────────────────────

function ColorPicker({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-10 rounded-xl border-2 border-border cursor-pointer p-0.5 bg-transparent"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#6366f1"
          className="w-32 font-mono text-sm"
          maxLength={7}
        />
        <div
          className="h-10 w-10 rounded-xl border-2 border-border shadow-sm transition-colors"
          style={{ backgroundColor: value }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function BrandingSection() {
  const { workspace, isLoading, save, saving } = useSave();
  const [botName,         setBotName]         = useState("");
  const [primaryColor,    setPrimaryColor]    = useState("#6366f1");
  const [secondaryColor,  setSecondaryColor]  = useState("#8b5cf6");
  const [textColor,       setTextColor]       = useState("#0f172a");
  const [iconColor,       setIconColor]       = useState("#6366f1");

  useEffect(() => {
    if (!workspace) return;
    setBotName(workspace.branding.bot_name ?? "");
    setPrimaryColor(workspace.branding.primary_color   ?? "#6366f1");
    setSecondaryColor(workspace.branding.secondary_color ?? "#8b5cf6");
    setTextColor(workspace.branding.text_color          ?? "#0f172a");
    setIconColor(workspace.branding.icon_color          ?? "#6366f1");
  }, [workspace?._id]);

  if (isLoading) return <SectionSkeleton />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({
          branding: {
            ...workspace?.branding,
            bot_name:        botName,
            primary_color:   primaryColor,
            secondary_color: secondaryColor,
            text_color:      textColor,
            icon_color:      iconColor,
          },
        });
      }}
      className="p-8 max-w-lg space-y-6"
    >
      <SectionHeader
        title="Branding & Apariencia"
        description="Personaliza los colores del administrador y la identidad del chat."
      />

      <div className="space-y-1.5">
        <Label>Nombre del bot (fallback)</Label>
        <Input
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          placeholder="Asistente"
        />
        <p className="text-xs text-muted-foreground">
          Se usa cuando ningún agente de IA tiene nombre propio configurado.
        </p>
      </div>

      <Separator />
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider -mb-2">
        Colores del administrador
      </p>

      <ColorPicker
        label="Color primario"
        description="Botones, elementos activos, íconos destacados y el widget del chat."
        value={primaryColor}
        onChange={setPrimaryColor}
      />

      <ColorPicker
        label="Color secundario"
        description="Badges, etiquetas y elementos de apoyo visual."
        value={secondaryColor}
        onChange={setSecondaryColor}
      />

      <ColorPicker
        label="Color del texto"
        description="Color principal del texto en el dashboard."
        value={textColor}
        onChange={setTextColor}
      />

      <ColorPicker
        label="Color de íconos"
        description="Color aplicado a los íconos de navegación y acciones."
        value={iconColor}
        onChange={setIconColor}
      />

      {/* Live preview strip */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-2.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b uppercase tracking-wider">
          Vista previa
        </div>
        <div className="p-4 space-y-3 bg-background">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <svg className="h-4 w-4" style={{ color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: textColor }}>TrivoxChat</p>
              <p className="text-xs text-muted-foreground">Dashboard de agentes</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Acción primaria
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: secondaryColor }}
            >
              Secundaria
            </button>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" style={{ color: iconColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm" style={{ color: textColor }}>Texto de ejemplo con el color configurado</span>
          </div>
        </div>
      </div>

      <SaveButton loading={saving} />
    </form>
  );
}

// ─── Comportamiento ───────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

const TIMEZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Lima",
  "America/Mexico_City",
  "America/Panama",
  "America/Santiago",
  "America/Caracas",
  "America/Montevideo",
  "America/La_Paz",
  "America/Guayaquil",
  "America/Asuncion",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
];

function BehaviorSection() {
  const { workspace, isLoading, save, saving } = useSave();
  const [language, setLanguage]       = useState("es");
  const [timezone, setTimezone]       = useState("America/Argentina/Buenos_Aires");
  const [autoAssign, setAutoAssign]   = useState(true);
  const [csatEnabled, setCsatEnabled] = useState(true);

  useEffect(() => {
    if (!workspace) return;
    setLanguage(workspace.settings.language ?? "es");
    setTimezone(workspace.settings.timezone ?? "America/Argentina/Buenos_Aires");
    setAutoAssign(workspace.settings.auto_assign ?? true);
    setCsatEnabled(workspace.settings.csat_enabled ?? true);
  }, [workspace?._id]);

  if (isLoading) return <SectionSkeleton />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({
          settings: {
            ...workspace?.settings,
            language,
            timezone,
            auto_assign:  autoAssign,
            csat_enabled: csatEnabled,
          },
        });
      }}
      className="p-8 max-w-lg space-y-6"
    >
      <SectionHeader
        title="Comportamiento"
        description="Ajusta el idioma, zona horaria y cómo se gestionan las conversaciones."
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Idioma</Label>
          <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Zona horaria</Label>
          <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-64">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz} className="text-xs">{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Asignación automática</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Asigna conversaciones al agente con menos carga cuando escalan del bot.
            </p>
          </div>
          <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Encuesta CSAT</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Envía una encuesta de satisfacción al cerrar cada conversación.
            </p>
          </div>
          <Switch checked={csatEnabled} onCheckedChange={setCsatEnabled} />
        </div>
      </div>

      <SaveButton loading={saving} />
    </form>
  );
}

// ─── Canales ──────────────────────────────────────────────────────────────────

function ChannelsSection() {
  const { data: channels = [], isLoading } = useChannels();
  const { data: workspace } = useWorkspace();
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const toggleChannel = useToggleChannel();
  const verifyMetaToken = useVerifyMetaToken();
  const verifyEmailCredentials = useVerifyEmailCredentials();
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Color por defecto: usa el primary del branding del workspace si no hay uno guardado en el canal
  const defaultWidgetColor = workspace?.branding?.primary_color ?? "#6366f1";

  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<ChannelType>("whatsapp");
  const [newName, setNewName] = useState("");
  const [newConfig, setNewConfig] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, any>>({});
  const [tokenVerification, setTokenVerification] = useState<{ valid: boolean; page_name?: string; page_id?: string; error?: string } | null>(null);
  const [editTokenVerification, setEditTokenVerification] = useState<{ valid: boolean; page_name?: string; page_id?: string; error?: string } | null>(null);
  const [emailVerifyResult, setEmailVerifyResult] = useState<{ valid: boolean; error?: string } | null>(null);

  const CHANNEL_ICONS: Record<string, string> = {
    whatsapp:           "🟢",
    whatsapp_baileys:   "🔓",
    telegram:           "🔵",
    web_widget:         "🌐",
    api:                "🔌",
    facebook_messenger: "💬",
    instagram_dm:       "📸",
    email:              "📧",
    slack:              "🟣",
    teams:              "🟦",
    sms:                "📱",
    line:               "🟩",
  };

  const CHANNEL_LABELS: Record<string, string> = {
    whatsapp:           "WhatsApp Business (API Oficial)",
    whatsapp_baileys:   "WhatsApp No Oficial (Baileys)",
    telegram:           "Telegram",
    web_widget:         "Widget Web",
    api:                "API",
    facebook_messenger: "Facebook Messenger",
    instagram_dm:       "Instagram DM",
    email:              "Email",
    slack:              "Slack",
    teams:              "Microsoft Teams",
    sms:                "SMS",
    line:               "LINE",
  };

  const WHATSAPP_FIELDS = [
    { key: "phone_number_id", label: "Phone Number ID", placeholder: "123456789012345", type: "text" },
    { key: "access_token", label: "Access Token", placeholder: "EAAxxxx...", type: "password" },
    { key: "app_secret", label: "App Secret", placeholder: "abc123...", type: "password" },
    { key: "verify_token", label: "Verify Token", placeholder: "mi_token_secreto_unico", type: "text" },
  ];

  const TELEGRAM_FIELDS = [
    { key: "bot_token", label: "Bot Token", placeholder: "123456:ABCDefGHI...", type: "password" },
    { key: "bot_username", label: "Username del bot", placeholder: "@MiEmpresaBot", type: "text" },
  ];

  const WIDGET_FIELDS = [
    { key: "welcome_message",         label: "Mensaje de bienvenida",                    placeholder: "¡Hola! ¿En qué puedo ayudarte?", type: "text",   description: "" },
    { key: "allowed_domains",         label: "Dominio permitido",                        placeholder: "miempresa.com",                  type: "text",   description: "" },
    { key: "pre_chat_form_enabled",   label: "Formulario pre-chat",                      placeholder: "",                               type: "switch", description: "Solicita datos del visitante antes de iniciar el chat por primera vez." },
    { key: "collect_phone",           label: "Solicitar teléfono",                       placeholder: "",                               type: "switch", description: "Muestra campo de teléfono en el formulario pre-chat." },
    { key: "collect_email",           label: "Solicitar correo electrónico",             placeholder: "",                               type: "switch", description: "Muestra campo de email en el formulario pre-chat." },
    { key: "collect_identification",  label: "Solicitar identificación / N° de cliente", placeholder: "",                               type: "switch", description: "Muestra campo de cédula, NIT o número de cliente." },
  ];

  const MESSENGER_FIELDS = [
    { key: "page_id", label: "Page ID", placeholder: "123456789012345", type: "text" },
    { key: "access_token", label: "Page Access Token", placeholder: "EAAxxxx...", type: "password" },
    { key: "app_secret", label: "App Secret", placeholder: "abc123...", type: "password" },
    { key: "verify_token", label: "Verify Token", placeholder: "mi_token_secreto_unico", type: "text" },
  ];

  const INSTAGRAM_FIELDS = [
    { key: "ig_account_id", label: "Instagram Account ID", placeholder: "17841400000000000", type: "text" },
    { key: "page_id", label: "Page ID vinculada", placeholder: "123456789012345", type: "text" },
    { key: "access_token", label: "Page Access Token", placeholder: "EAAxxxx...", type: "password" },
    { key: "app_secret", label: "App Secret", placeholder: "abc123...", type: "password" },
    { key: "verify_token", label: "Verify Token", placeholder: "mi_token_secreto_unico", type: "text" },
  ];

  // Campos del canal email — se organizan en dos secciones (entrada y salida)
  // pero los guardamos todos en el mismo config del canal.
  const EMAIL_FIELDS = [
    // ── Entrada (inbound) ──
    { key: "inbox_address",          label: "Dirección del inbox",            placeholder: "soporte@midominio.com",          type: "email",    section: "inbound" },
    { key: "inbound_provider",       label: "Proveedor de email entrante",    placeholder: "sendgrid · mailgun · postmark · generic", type: "text", section: "inbound" },
    { key: "inbound_webhook_secret", label: "Secret del webhook (opcional)",  placeholder: "clave para verificar autenticidad",      type: "password", section: "inbound" },
    { key: "reply_to",               label: "Reply-To (opcional)",            placeholder: "reply@midominio.com",            type: "email",    section: "inbound" },
    // ── Salida (outbound) ──
    { key: "outbound_provider", label: "Proveedor de salida",    placeholder: "smtp · sendgrid · mailgun",      type: "text",     section: "outbound" },
    { key: "display_name",      label: "Nombre del remitente",   placeholder: "Soporte Mi Empresa",             type: "text",     section: "outbound" },
    // SMTP
    { key: "smtp_host",         label: "Servidor SMTP",          placeholder: "smtp.gmail.com",                 type: "text",     section: "smtp" },
    { key: "smtp_port",         label: "Puerto SMTP",            placeholder: "587",                            type: "text",     section: "smtp" },
    { key: "smtp_user",         label: "Usuario SMTP",           placeholder: "usuario@gmail.com",              type: "text",     section: "smtp" },
    { key: "smtp_password",     label: "Contraseña SMTP",        placeholder: "••••••••",                       type: "password", section: "smtp" },
    // SendGrid salida
    { key: "sendgrid_api_key",  label: "SendGrid API Key",       placeholder: "SG.xxx",                        type: "password", section: "sendgrid" },
    // Mailgun salida
    { key: "mailgun_api_key",   label: "Mailgun API Key",        placeholder: "key-xxx",                       type: "password", section: "mailgun" },
    { key: "mailgun_domain",    label: "Mailgun Domain",         placeholder: "mg.midominio.com",              type: "text",     section: "mailgun" },
    { key: "mailgun_region",    label: "Mailgun Región",         placeholder: "us · eu",                       type: "text",     section: "mailgun" },
    // Firma
    { key: "signature_html",    label: "Firma de email (HTML)",  placeholder: "<p>— Mi Empresa</p>",           type: "text",     section: "signature" },
  ];

  // Campos a mostrar según el proveedor de salida seleccionado
  const getEmailFields = (config: Record<string, string>) => {
    const outbound = config.outbound_provider || "smtp";
    const base = EMAIL_FIELDS.filter(f => f.section === "inbound" || f.section === "outbound" || f.section === "signature");
    const smtpFields     = outbound === "smtp"      ? EMAIL_FIELDS.filter(f => f.section === "smtp")     : [];
    const sgFields       = outbound === "sendgrid"  ? EMAIL_FIELDS.filter(f => f.section === "sendgrid") : [];
    const mgFields       = outbound === "mailgun"   ? EMAIL_FIELDS.filter(f => f.section === "mailgun")  : [];
    return [...base, ...smtpFields, ...sgFields, ...mgFields];
  };

  const isMetaType = (type: string) => type === "facebook_messenger" || type === "instagram_dm";

  const SLACK_FIELDS = [
    { key: "bot_token",      label: "Bot User OAuth Token", placeholder: "xoxb-...", type: "password" },
    { key: "signing_secret", label: "Signing Secret",       placeholder: "Desde Basic Information → Signing Secret", type: "password" },
    { key: "team_id",        label: "Team ID",              placeholder: "TXXXXXXXX", type: "text" },
  ];

  const TEAMS_FIELDS = [
    { key: "app_id",       label: "App ID (Azure Bot)",       placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", type: "text"     },
    { key: "app_password", label: "App Password (Client Secret)", placeholder: "xxxxxxxx...", type: "password" },
  ];

  const SMS_BASE_FIELDS = [
    { key: "provider",      label: "Proveedor",           placeholder: "twilio · vonage · sns", type: "text" },
    { key: "phone_number",  label: "Número de teléfono",  placeholder: "+15551234567", type: "text" },
  ];
  const SMS_TWILIO_FIELDS = [
    { key: "account_sid",  label: "Account SID",   placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", type: "text" },
    { key: "auth_token",   label: "Auth Token",    placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", type: "password" },
  ];
  const SMS_VONAGE_FIELDS = [
    { key: "api_key",      label: "API Key",       placeholder: "abc12345", type: "text" },
    { key: "api_secret",   label: "API Secret",    placeholder: "xxxxxxxxxxxxxxxx", type: "password" },
  ];
  const SMS_SNS_FIELDS = [
    { key: "aws_access_key_id",     label: "AWS Access Key ID",     placeholder: "AKIAIOSFODNN7EXAMPLE", type: "text"     },
    { key: "aws_secret_access_key", label: "AWS Secret Access Key", placeholder: "wJalrXUtnFEMI/...",     type: "password" },
    { key: "aws_region",            label: "AWS Region",            placeholder: "us-east-1",              type: "text"     },
  ];

  const getSMSFields = (config?: Record<string, string>) => {
    const provider = config?.provider || "twilio";
    if (provider === "vonage") return [...SMS_BASE_FIELDS, ...SMS_VONAGE_FIELDS];
    if (provider === "sns")    return [...SMS_BASE_FIELDS, ...SMS_SNS_FIELDS];
    return [...SMS_BASE_FIELDS, ...SMS_TWILIO_FIELDS]; // twilio por defecto
  };

  const LINE_FIELDS = [
    { key: "channel_access_token", label: "Channel Access Token", placeholder: "Desde LINE Developers → Messaging API → Channel access token", type: "password" },
    { key: "channel_secret",       label: "Channel Secret",       placeholder: "Desde LINE Developers → Basic settings → Channel secret",     type: "password" },
    { key: "channel_id",           label: "Channel ID",           placeholder: "12345678", type: "text" },
  ];

  const getFields = (type: string, config?: Record<string, string>): Array<{ key: string; label: string; placeholder: string; type: string; description?: string }> => {
    if (type === "whatsapp") return WHATSAPP_FIELDS;
    if (type === "whatsapp_baileys") return []; // Sin campos — usa QR
    if (type === "telegram") return TELEGRAM_FIELDS;
    if (type === "web_widget") return WIDGET_FIELDS;
    if (type === "facebook_messenger") return MESSENGER_FIELDS;
    if (type === "instagram_dm") return INSTAGRAM_FIELDS;
    if (type === "email") return getEmailFields(config || {});
    if (type === "slack") return SLACK_FIELDS;
    if (type === "teams") return TEAMS_FIELDS;
    if (type === "sms") return getSMSFields(config);
    if (type === "line") return LINE_FIELDS;
    return [];
  };

  const getWebhookUrl = (channel: Channel) => {
    if (channel.type === "whatsapp_baileys") return null; // Sin webhook — usa conexión persistente
    if (channel.type === "whatsapp") return `${BACKEND_URL}/webhooks/whatsapp`;
    if (channel.type === "telegram") return `${BACKEND_URL}/webhooks/telegram`;
    if (channel.type === "facebook_messenger" || channel.type === "instagram_dm") return `${BACKEND_URL}/webhooks/meta`;
    if (channel.type === "email") {
      return `${BACKEND_URL}/webhooks/email/${channel._id}`;
    }
    if (channel.type === "slack") return `${BACKEND_URL}/webhooks/slack/events`;
    if (channel.type === "teams") return `${BACKEND_URL}/webhooks/teams/messages`;
    if (channel.type === "sms") {
      const smsProvider = (channel.config?.provider as string) || "twilio";
      return `${BACKEND_URL}/webhooks/sms/${smsProvider}`;
    }
    if (channel.type === "line") return `${BACKEND_URL}/webhooks/line`;
    return null;
  };

  const handleVerifyToken = async (token: string, isEdit = false) => {
    if (!token) return;
    try {
      const result = await verifyMetaToken.mutateAsync(token);
      if (isEdit) setEditTokenVerification(result);
      else setTokenVerification(result);
    } catch {
      const err = { valid: false, error: "No se pudo conectar con la API de Meta" };
      if (isEdit) setEditTokenVerification(err);
      else setTokenVerification(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createChannel.mutateAsync({ name: newName, type: newType, config: newConfig });
      toast.success("Canal creado");
      setCreating(false);
      setNewName("");
      setNewConfig({});
      setTokenVerification(null);
    } catch {
      toast.error("No se pudo crear el canal");
    }
  };

  const handleUpdate = async (channelId: string) => {
    try {
      await updateChannel.mutateAsync({ channelId, config: editConfig });
      toast.success("Canal actualizado");
      setEditingId(null);
    } catch {
      toast.error("No se pudo actualizar el canal");
    }
  };

  const handleToggle = async (channelId: string, active: boolean) => {
    try {
      await toggleChannel.mutateAsync({ channelId, active });
      toast.success(active ? "Canal activado" : "Canal desactivado");
    } catch {
      toast.error("No se pudo cambiar el estado");
    }
  };

  if (isLoading) return <SectionSkeleton />;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader
          title="Canales"
          description="Configura los canales de comunicación: WhatsApp, Telegram, Facebook Messenger, Instagram DM y Widget Web."
        />
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo canal
          </Button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <form onSubmit={handleCreate} className="rounded-lg border bg-muted/20 p-5 mb-5 space-y-4">
          <p className="text-sm font-semibold">Nuevo canal</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="WhatsApp Principal" required />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={newType} onValueChange={(v) => { setNewType(v as ChannelType); setNewConfig({}); setTokenVerification(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Canales Oficiales</div>
                  <SelectItem value="whatsapp">WhatsApp Business (API Oficial)</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="web_widget">Widget Web</SelectItem>
                  <SelectItem value="facebook_messenger">Facebook Messenger</SelectItem>
                  <SelectItem value="instagram_dm">Instagram DM</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="sms">SMS (Twilio / Vonage / SNS)</SelectItem>
                  <SelectItem value="line">LINE</SelectItem>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">Canales No Oficiales</div>
                  <SelectItem value="whatsapp_baileys">⚠️ WhatsApp No Oficial (Baileys)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {getFields(newType, newConfig).map((f) => (
            <div key={f.key} className="space-y-1.5">
              {f.type === "switch" ? (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    {f.description && <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>}
                  </div>
                  <Switch
                    checked={!!newConfig[f.key]}
                    onCheckedChange={(v) => setNewConfig((c) => ({ ...c, [f.key]: v }))}
                  />
                </div>
              ) : (
                <>
                  <Label>{f.label}</Label>
                  {f.type === "color" ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={newConfig[f.key] || defaultWidgetColor}
                        onChange={(e) => setNewConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                        className="h-10 w-10 rounded-xl border-2 border-border cursor-pointer p-0.5 bg-transparent"
                      />
                      <Input
                        value={newConfig[f.key] ?? ""}
                        onChange={(e) => setNewConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                        placeholder={defaultWidgetColor}
                        className="w-32 font-mono text-sm"
                        maxLength={7}
                      />
                      <div
                        className="h-10 w-10 rounded-xl border-2 border-border shadow-sm transition-colors"
                        style={{ backgroundColor: newConfig[f.key] || defaultWidgetColor }}
                      />
                    </div>
                  ) : (
                    <Input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={newConfig[f.key] ?? ""}
                      onChange={(e) => setNewConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                    />
                  )}
                </>
              )}
            </div>
          ))}

          {/* Instrucciones canal email */}
          {newType === "email" && newConfig.inbound_provider && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3 space-y-1">
              <p className="text-xs font-medium text-blue-800">Configura el proveedor de entrada</p>
              {newConfig.inbound_provider === "sendgrid" && (
                <p className="text-xs text-blue-700">
                  En SendGrid → Settings → Inbound Parse, configura el dominio y apunta a: <code className="font-mono bg-blue-100 px-1 rounded">{(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")}/webhooks/email/sendgrid</code>
                </p>
              )}
              {newConfig.inbound_provider === "mailgun" && (
                <p className="text-xs text-blue-700">
                  En Mailgun → Receiving → Routes, crea una ruta que haga forward a: <code className="font-mono bg-blue-100 px-1 rounded">{(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")}/webhooks/email/mailgun</code>
                </p>
              )}
              {newConfig.inbound_provider === "postmark" && (
                <p className="text-xs text-blue-700">
                  En Postmark → tu server → Settings → Inbound, configura la Webhook URL: <code className="font-mono bg-blue-100 px-1 rounded">{(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001")}/webhooks/email/postmark</code>
                </p>
              )}
            </div>
          )}

          {/* Slack: instrucciones de configuración manual */}
          {newType === "slack" && (
            <div className="rounded-md bg-purple-50 border border-purple-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-purple-900">Configuración de Slack</p>
              <ol className="text-xs text-purple-700 space-y-1 list-decimal list-inside">
                <li>Crea una <strong>Slack App</strong> en api.slack.com/apps → Create New App</li>
                <li>En <strong>OAuth & Permissions</strong>, agrega los scopes: <code className="font-mono bg-purple-100 px-1 rounded">chat:write</code>, <code className="font-mono bg-purple-100 px-1 rounded">im:read</code>, <code className="font-mono bg-purple-100 px-1 rounded">im:write</code>, <code className="font-mono bg-purple-100 px-1 rounded">channels:read</code>, <code className="font-mono bg-purple-100 px-1 rounded">app_mentions:read</code></li>
                <li>Instala la app en tu workspace y copia el <strong>Bot User OAuth Token</strong> (<code className="font-mono bg-purple-100 px-1 rounded">xoxb-...</code>)</li>
                <li>En <strong>Basic Information</strong> copia el <strong>Signing Secret</strong></li>
                <li>En <strong>Event Subscriptions</strong>, activa y apunta a: <code className="font-mono bg-purple-100 px-1 rounded">{BACKEND_URL}/webhooks/slack/events</code></li>
                <li>En <strong>Slash Commands</strong>, crea <code className="font-mono bg-purple-100 px-1 rounded">/trivox</code> apuntando a: <code className="font-mono bg-purple-100 px-1 rounded">{BACKEND_URL}/webhooks/slack/slash</code></li>
                <li>Copia el <strong>Team ID</strong> de tu workspace (empieza con <code className="font-mono bg-purple-100 px-1 rounded">T</code>) y pégalo abajo</li>
              </ol>
            </div>
          )}

          {/* SMS: instrucciones por proveedor */}
          {newType === "sms" && newConfig.provider && (
            <div className="rounded-md bg-green-50 border border-green-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-green-900">Configuración de webhook SMS</p>
              {(newConfig.provider === "twilio" || !newConfig.provider) && (
                <p className="text-xs text-green-700">
                  En <strong>Twilio Console → Phone Numbers → tu número → Messaging → Webhook</strong>, configura:{" "}
                  <code className="font-mono bg-green-100 px-1 rounded">{BACKEND_URL}/webhooks/sms/twilio</code>
                  {" "}(HTTP POST). El costo estimado por SMS enviado se muestra en cada mensaje.
                </p>
              )}
              {newConfig.provider === "vonage" && (
                <p className="text-xs text-green-700">
                  En <strong>Vonage Dashboard → Numbers → tu número → SMS</strong>, configura:{" "}
                  <code className="font-mono bg-green-100 px-1 rounded">{BACKEND_URL}/webhooks/sms/vonage</code>
                </p>
              )}
              {newConfig.provider === "sns" && (
                <p className="text-xs text-green-700">
                  Para mensajes entrantes vía SNS/Pinpoint, crea una suscripción HTTP al tópico SNS apuntando a:{" "}
                  <code className="font-mono bg-green-100 px-1 rounded">{BACKEND_URL}/webhooks/sms/vonage</code>.
                  El envío (outbound) funciona directamente con las credenciales AWS.
                </p>
              )}
            </div>
          )}

          {/* LINE: instrucciones */}
          {newType === "line" && (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-emerald-900">Configuración de LINE</p>
              <ol className="text-xs text-emerald-700 space-y-1 list-decimal list-inside">
                <li>Crea un <strong>LINE Official Account</strong> y un canal <strong>Messaging API</strong> en developers.line.biz</li>
                <li>En <strong>Basic settings</strong>, copia el <strong>Channel secret</strong></li>
                <li>En <strong>Messaging API</strong>, emite un <strong>Channel access token</strong> (long-lived)</li>
                <li>Activa <strong>Use webhook</strong> y configura la URL:{" "}
                  <code className="font-mono bg-emerald-100 px-1 rounded">{BACKEND_URL}/webhooks/line</code>
                </li>
                <li>Verifica el webhook con el botón <strong>Verify</strong> en el portal</li>
              </ol>
            </div>
          )}

          {/* Teams: instrucciones Azure Bot Registration */}
          {newType === "teams" && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-900">Configuración de Microsoft Teams</p>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Crea un <strong>Azure Bot Resource</strong> en portal.azure.com</li>
                <li>En el bot, ve a <strong>Configuration</strong> y pega como Messaging endpoint:{" "}
                  <code className="font-mono bg-blue-100 px-1 rounded">{BACKEND_URL}/webhooks/teams/messages</code>
                </li>
                <li>En <strong>Channels</strong>, activa <strong>Microsoft Teams</strong></li>
                <li>Copia el <strong>App ID</strong> y crea un <strong>Client Secret</strong> en Certificates &amp; secrets</li>
                <li>Pega esos valores en los campos de arriba y guarda</li>
              </ol>
            </div>
          )}

          {/* Advertencia canal Baileys */}
          {newType === "whatsapp_baileys" && <BaileysRiskWarning />}

          {/* Verificación de token para canales Meta */}
          {isMetaType(newType) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!newConfig.access_token || verifyMetaToken.isPending}
                  onClick={() => handleVerifyToken(newConfig.access_token)}
                >
                  {verifyMetaToken.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                  Verificar Access Token
                </Button>
                {tokenVerification && (
                  <span className={`text-xs font-medium ${tokenVerification.valid ? "text-green-600" : "text-destructive"}`}>
                    {tokenVerification.valid
                      ? `✓ Válido — ${tokenVerification.page_name} (ID: ${tokenVerification.page_id})`
                      : `✗ ${tokenVerification.error}`}
                  </span>
                )}
              </div>
              {tokenVerification?.valid && (
                <p className="text-xs text-muted-foreground">
                  Token verificado correctamente. Recuerda configurar el webhook en el Meta Developer Portal usando la URL que aparecerá al guardar.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createChannel.isPending}>
              {createChannel.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Crear canal
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setCreating(false); setTokenVerification(null); }}>
              <X className="h-4 w-4 mr-1" />Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Channel list */}
      {channels.length === 0 && !creating ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">Sin canales. Crea uno para empezar a recibir mensajes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((ch) => {
            const isEditing = editingId === ch._id;
            const webhookUrl = getWebhookUrl(ch);
            return (
              <div key={ch._id} className={`rounded-lg border p-4 space-y-3 ${!ch.active ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{CHANNEL_ICONS[ch.type] ?? "📡"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ch.name}</p>
                    <p className="text-xs text-muted-foreground">{CHANNEL_LABELS[ch.type]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ch.active}
                      onCheckedChange={(v) => handleToggle(ch._id, v)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(isEditing ? null : ch._id);
                        setEditConfig({ ...ch.config });
                        setEditTokenVerification(null);
                      }}
                    >
                      {isEditing ? "Cancelar" : "Configurar"}
                    </Button>
                  </div>
                </div>

                {/* Panel de conexión para canal Baileys */}
                {ch.type === "whatsapp_baileys" && (
                  <BaileysConnectPanel channelId={ch._id} />
                )}

                {/* Webhook URL info */}
                {webhookUrl && (
                  <div className="bg-muted/50 rounded-md p-2.5 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      URL del Webhook{" "}
                      {ch.type === "whatsapp" && "(Meta / WhatsApp)"}
                      {ch.type === "telegram" && "(Telegram)"}
                      {ch.type === "facebook_messenger" && "(Meta — Facebook Messenger)"}
                      {ch.type === "instagram_dm" && "(Meta — Instagram DM)"}
                      :
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs flex-1 break-all">{webhookUrl}</code>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copiado"); }}
                        className="text-xs text-primary hover:underline shrink-0"
                      >Copiar</button>
                    </div>
                    {isMetaType(ch.type) && (
                      <p className="text-xs text-muted-foreground pt-0.5">
                        Configura esta URL en Meta Developer Portal → Tu App → Webhooks. El Verify Token es el que ingresaste en la configuración del canal.
                      </p>
                    )}
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div className="space-y-3 pt-2 border-t">
                    {getFields(ch.type, editConfig).map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        {f.type === "switch" ? (
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                              <p className="text-sm font-medium">{f.label}</p>
                              {f.description && <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>}
                            </div>
                            <Switch
                              checked={!!editConfig[f.key]}
                              onCheckedChange={(v) => setEditConfig((c) => ({ ...c, [f.key]: v }))}
                            />
                          </div>
                        ) : (
                          <>
                            <Label className="text-xs">{f.label}</Label>
                            {f.type === "color" ? (
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <input
                                    type="color"
                                    value={editConfig[f.key] || defaultWidgetColor}
                                    onChange={(e) => setEditConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                                    className="h-10 w-10 rounded-xl border-2 border-border cursor-pointer p-0.5 bg-transparent"
                                  />
                                </div>
                                <Input
                                  value={editConfig[f.key] ?? ""}
                                  onChange={(e) => setEditConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                                  placeholder={defaultWidgetColor}
                                  className="w-32 font-mono text-sm"
                                  maxLength={7}
                                />
                                <div
                                  className="h-10 w-10 rounded-xl border-2 border-border shadow-sm transition-colors"
                                  style={{ backgroundColor: editConfig[f.key] || defaultWidgetColor }}
                                />
                              </div>
                            ) : (
                              <Input
                                type={f.type}
                                placeholder={f.placeholder}
                                value={editConfig[f.key] ?? ""}
                                onChange={(e) => setEditConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                              />
                            )}
                          </>
                        )}
                      </div>
                    ))}

                    {/* Verificación de token para canales Meta */}
                    {isMetaType(ch.type) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!editConfig.access_token || verifyMetaToken.isPending}
                          onClick={() => handleVerifyToken(editConfig.access_token, true)}
                        >
                          {verifyMetaToken.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                          Verificar token
                        </Button>
                        {editTokenVerification && (
                          <span className={`text-xs font-medium ${editTokenVerification.valid ? "text-green-600" : "text-destructive"}`}>
                            {editTokenVerification.valid
                              ? `✓ ${editTokenVerification.page_name} (ID: ${editTokenVerification.page_id})`
                              : `✗ ${editTokenVerification.error}`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Fragmento de instalación — solo web_widget */}
                    {ch.type === "web_widget" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Fragmento de instalación</Label>
                        <div className="relative rounded-lg border bg-muted/50 p-3">
                          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">{`<script\n  src="https://widget.chat.nexoradeveloper.com/widget.min.js"\n  data-workspace="${workspace?.slug ?? "TU_WORKSPACE_SLUG"}"\n></script>`}</pre>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => {
                              navigator.clipboard.writeText(`<script\n  src="https://widget.chat.nexoradeveloper.com/widget.min.js"\n  data-workspace="${workspace?.slug ?? "TU_WORKSPACE_SLUG"}"\n></script>`);
                              toast.success("Fragmento copiado");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Pega este código antes del cierre de <code>&lt;/body&gt;</code> en tu sitio web.</p>
                      </div>
                    )}

                    {/* Diseño visual — solo web_widget */}
                    {ch.type === "web_widget" && workspaceId && (
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Diseño del widget
                        </p>
                        <WebchatDesigner
                          channelId={ch._id}
                          workspaceId={workspaceId}
                          initialDesign={(ch.config as any)?.design}
                          onSaved={() => setEditingId(null)}
                        />
                      </div>
                    )}

                    {/* Verificar credenciales canal email */}
                    {ch.type === "email" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={verifyEmailCredentials.isPending}
                          onClick={async () => {
                            // Guardar primero para que el backend tenga las credenciales
                            await updateChannel.mutateAsync({ channelId: ch._id, config: { ...ch.config, ...editConfig } });
                            const result = await verifyEmailCredentials.mutateAsync(ch._id);
                            setEmailVerifyResult(result);
                          }}
                        >
                          {verifyEmailCredentials.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                          Verificar credenciales de salida
                        </Button>
                        {emailVerifyResult && (
                          <span className={`text-xs font-medium ${emailVerifyResult.valid ? "text-green-600" : "text-destructive"}`}>
                            {emailVerifyResult.valid ? "✓ Conexión exitosa" : `✗ ${emailVerifyResult.error}`}
                          </span>
                        )}
                      </div>
                    )}

                    <Button size="sm" onClick={() => handleUpdate(ch._id)} disabled={updateChannel.isPending}>
                      {updateChannel.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                      Guardar configuración
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Ventas y Cobro ───────────────────────────────────────────────────────────

const GATEWAY_OPTIONS: {
  id: GatewayProvider;
  label: string;
  icon: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  note?: string;
}[] = [
  {
    id: "stripe",
    label: "Stripe",
    icon: "💳",
    fields: [
      { key: "secret_key",      label: "Secret Key",      placeholder: "sk_live_xxx  o  sk_test_xxx", type: "password" },
      { key: "webhook_secret",  label: "Webhook Secret",  placeholder: "whsec_xxx", type: "password" },
      { key: "publishable_key", label: "Publishable Key", placeholder: "pk_live_xxx", type: "text" },
      { key: "success_url",     label: "URL de éxito",    placeholder: "https://mitienda.com/gracias", type: "text" },
      { key: "cancel_url",      label: "URL de cancelación", placeholder: "https://mitienda.com/cancelado", type: "text" },
    ],
    note: "Webhook URL a configurar en Stripe Dashboard → Developers → Webhooks",
  },
  {
    id: "mercadopago",
    label: "MercadoPago",
    icon: "🟦",
    fields: [
      { key: "access_token", label: "Access Token", placeholder: "APP_USR-xxx", type: "password" },
      { key: "success_url",  label: "URL de éxito", placeholder: "https://mitienda.com/gracias", type: "text" },
      { key: "cancel_url",   label: "URL de cancelación", placeholder: "https://mitienda.com/cancelado", type: "text" },
    ],
    note: "La URL de notificaciones se configura automáticamente al crear el link de pago",
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: "🅿️",
    fields: [
      { key: "client_id",     label: "Client ID",     placeholder: "AaBbCcDd...", type: "text" },
      { key: "client_secret", label: "Client Secret", placeholder: "EeFfGgHh...", type: "password" },
      { key: "webhook_id",    label: "Webhook ID",    placeholder: "ID del webhook en PayPal Developer", type: "text" },
      { key: "success_url",   label: "URL de éxito",  placeholder: "https://mitienda.com/gracias", type: "text" },
      { key: "cancel_url",    label: "URL de cancelación", placeholder: "https://mitienda.com/cancelado", type: "text" },
    ],
    note: "Configura la Webhook URL en PayPal Developer → Apps & Credentials → Webhooks. Eventos: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED",
  },
  {
    id: "wompi",
    label: "Wompi",
    icon: "🇨🇴",
    fields: [
      { key: "public_key",    label: "Llave Pública",  placeholder: "pub_test_xxx  o  pub_prod_xxx", type: "text" },
      { key: "private_key",   label: "Llave Privada",  placeholder: "prv_test_xxx  o  prv_prod_xxx", type: "password" },
      { key: "events_secret", label: "Secreto de Eventos", placeholder: "test_events_xxx  o  prod_events_xxx", type: "password" },
      { key: "success_url",   label: "URL de redirección", placeholder: "https://mitienda.com/gracias", type: "text" },
    ],
    note: "Configura la Webhook URL en el Dashboard de Wompi → Configuración → Eventos. Moneda: COP",
  },
  {
    id: "epayco",
    label: "ePayco",
    icon: "🇨🇴",
    fields: [
      { key: "p_cust_id_cliente", label: "P_CUST_ID_CLIENTE", placeholder: "ID de cliente ePayco", type: "text" },
      { key: "p_key",             label: "P_KEY",             placeholder: "Llave privada ePayco", type: "password" },
      { key: "public_key",        label: "Llave Pública",     placeholder: "public_key de tu cuenta", type: "text" },
      { key: "private_key",       label: "Llave Privada API", placeholder: "private_key de tu cuenta", type: "password" },
      { key: "success_url",       label: "URL de respuesta",  placeholder: "https://mitienda.com/gracias", type: "text" },
    ],
    note: "La URL de confirmación se configura automáticamente. Monedas: COP, USD",
  },
  {
    id: "payu",
    label: "PayU",
    icon: "🔶",
    fields: [
      { key: "merchant_id", label: "Merchant ID",  placeholder: "ID de tu comercio en PayU", type: "text" },
      { key: "account_id",  label: "Account ID",   placeholder: "ID de la cuenta por país (CO, MX, PE…)", type: "text" },
      { key: "api_key",     label: "API Key",      placeholder: "Llave API de PayU", type: "password" },
      { key: "api_login",   label: "API Login",    placeholder: "Login API de PayU", type: "text" },
      { key: "response_url", label: "URL de respuesta", placeholder: "https://mitienda.com/gracias", type: "text" },
    ],
    note: "La URL de confirmación se configura automáticamente. Soporta: COP, USD, MXN, PEN, ARS, BRL",
  },
];

// ── Pasarelas ─────────────────────────────────────────────────────────────────

function GatewaysTab({ backendUrl, workspaceId }: { backendUrl: string; workspaceId: string }) {
  const { data: gateways = [], isLoading } = usePaymentGateways();
  const saveGateway   = useSavePaymentGateway();
  const verifyGateway = useVerifyPaymentGateway();
  const deleteGateway = useDeletePaymentGateway();

  const [activeGateway, setActiveGateway] = useState<GatewayProvider | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [testMode, setTestMode] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; display_name?: string; email?: string; error?: string } | null>(null);
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});

  const getConfiguredGateway = (id: GatewayProvider) =>
    gateways.find((g) => g.provider === id);

  const handleOpen = (id: GatewayProvider) => {
    setActiveGateway(id);
    setFields({});
    setVerifyResult(null);
    const existing = getConfiguredGateway(id);
    setTestMode(existing?.test_mode ?? false);
  };

  const handleSave = async () => {
    if (!activeGateway) return;
    await saveGateway.mutateAsync({ provider: activeGateway, credentials: fields, test_mode: testMode });
    setActiveGateway(null);
  };

  const handleVerify = async () => {
    if (!activeGateway) return;
    // Primero guardar para que el backend tenga las credenciales
    await saveGateway.mutateAsync({ provider: activeGateway, credentials: fields, test_mode: testMode });
    const result = await verifyGateway.mutateAsync(activeGateway);
    setVerifyResult(result);
  };

  if (isLoading) return <SectionSkeleton />;

  if (activeGateway) {
    const option = GATEWAY_OPTIONS.find((g) => g.id === activeGateway)!;
    const existing = getConfiguredGateway(activeGateway);
    const webhookUrl = `${backendUrl}/webhooks/payments/${activeGateway}/${workspaceId}`;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActiveGateway(null)}>← Volver</Button>
          <span className="text-sm font-medium">{option.icon} {option.label}</span>
        </div>

        {/* Webhook URL */}
        <div className="rounded-md bg-muted/50 border p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">URL del Webhook para {option.label}:</p>
          <div className="flex items-center gap-2">
            <code className="text-xs flex-1 break-all">{webhookUrl}</code>
            <button type="button" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copiado"); }} className="text-xs text-primary hover:underline shrink-0">
              Copiar
            </button>
          </div>
          {option.note && <p className="text-xs text-muted-foreground">{option.note}</p>}
        </div>

        {/* Credential fields */}
        <div className="space-y-3">
          {option.fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                {f.label}
                {existing?.credentials_configured?.[f.key] && (
                  <span className="text-xs font-normal text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">✓ Configurado</span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  type={f.type === "password" && !showFields[f.key] ? "password" : "text"}
                  placeholder={existing?.credentials_configured?.[f.key] ? "••••••  (dejar vacío para no cambiar)" : f.placeholder}
                  value={fields[f.key] ?? ""}
                  onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="font-mono text-sm"
                />
                {f.type === "password" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowFields((s) => ({ ...s, [f.key]: !s[f.key] }))}>
                    {showFields[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Test mode */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Modo de prueba (Sandbox)</p>
            <p className="text-xs text-muted-foreground mt-0.5">Activa para usar credenciales de prueba. Los pagos no son reales.</p>
          </div>
          <Switch checked={testMode} onCheckedChange={setTestMode} />
        </div>

        {/* Verify result */}
        {verifyResult && (
          <div className={`rounded-md p-3 text-sm border ${verifyResult.valid ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {verifyResult.valid
              ? `✓ Credenciales válidas${verifyResult.display_name ? ` — ${verifyResult.display_name}` : ""}${verifyResult.email ? ` (${verifyResult.email})` : ""}`
              : `✗ ${verifyResult.error}`}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" disabled={saveGateway.isPending} onClick={handleSave}>
            {saveGateway.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar
          </Button>
          <Button size="sm" variant="outline" disabled={verifyGateway.isPending || saveGateway.isPending} onClick={handleVerify}>
            {verifyGateway.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
            Verificar credenciales
          </Button>
          {existing && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive ml-auto" onClick={() => { deleteGateway.mutate(activeGateway); setActiveGateway(null); }}>
              <Trash2 className="h-4 w-4 mr-1" />Eliminar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Configura las pasarelas que tus bots usarán para cobrar. Cada workspace usa sus propias credenciales.</p>
      {GATEWAY_OPTIONS.map((g) => {
        const configured = getConfiguredGateway(g.id);
        return (
          <div key={g.id} className="rounded-lg border p-4 flex items-center gap-3">
            <span className="text-2xl">{g.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{g.label}</p>
              <p className="text-xs text-muted-foreground">
                {configured
                  ? configured.test_mode ? "Configurado · Modo prueba" : "Configurado · Producción"
                  : "No configurado"}
              </p>
            </div>
            {configured && (
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">✓ Activo</span>
            )}
            <Button size="sm" variant="outline" onClick={() => handleOpen(g.id)}>
              {configured ? "Configurar" : "Conectar"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}


// ─── Integraciones ────────────────────────────────────────────────────────────

function IntegrationsSection() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const [tab, setTab] = useState<"ia" | "pagos" | "erp">("ia");

  return (
    <div className="p-8 max-w-3xl">
      <SectionHeader
        title="Integraciones"
        description="Conecta todos los servicios externos desde un solo lugar. Cada workspace usa sus propias credenciales."
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 mb-6 w-fit">
        {([
          { id: "ia"    as const, label: "Motores de IA",    icon: Cpu        },
          { id: "pagos" as const, label: "Pasarelas de pago", icon: DollarSign },
          { id: "erp"   as const, label: "ERP / Contabilidad", icon: Database  },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              tab === id ? "bg-background shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "ia"    && <AIProviderSection />}
      {tab === "pagos" && <GatewaysTab backendUrl={BACKEND_URL} workspaceId={workspaceId!} />}
      {tab === "erp"   && <ERPIntegrationsTab />}
    </div>
  );
}

// ─── Equipo ───────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner:  "Owner",
  admin:  "Admin",
  agent:  "Agente",
  viewer: "Visor",
};

const ROLE_COLORS: Record<string, string> = {
  owner:  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  admin:  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  agent:  "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  viewer: "bg-muted text-muted-foreground",
};

const DEPT_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316",
  "#eab308","#22c55e","#14b8a6","#06b6d4","#3b82f6",
];

type TeamTab = "members" | "departments";
type MemberModal = "none" | "create" | "invite";

function TeamSection() {
  const { data: members = [],    isLoading: loadingMembers }  = useWorkspaceMembers();
  const { data: departments = [], isLoading: loadingDepts }   = useDepartments();
  const createMember  = useCreateMember();
  const invite        = useInviteMember();
  const updateMember  = useUpdateMember();
  const createDept    = useCreateDepartment();
  const updateDept    = useUpdateDepartment();
  const deleteDept    = useDeleteDepartment();
  const currentUserId = useAuthStore((s) => s.user?._id);

  const [tab,         setTab]         = useState<TeamTab>("members");
  const [memberModal, setMemberModal] = useState<MemberModal>("none");
  const [deptFilter,  setDeptFilter]  = useState<string>("all");

  // Create member form
  const [cm, setCm] = useState({ name: "", email: "", password: "", role: "agent" as "admin"|"agent"|"viewer", department_id: "" });

  // Invite form
  const [inv, setInv] = useState({ email: "", role: "agent" as "admin"|"agent"|"viewer", department_id: "" });

  // Department form
  const [deptForm,    setDeptForm]    = useState({ name: "", description: "", color: "#6366f1" });
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [showDeptForm,setShowDeptForm]= useState(false);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (["agent", "viewer"].includes(cm.role) && !cm.department_id) {
      toast.error("Los agentes y visores deben tener un departamento asignado");
      return;
    }
    try {
      await createMember.mutateAsync({ ...cm, department_id: cm.department_id || null });
      setCm({ name: "", email: "", password: "", role: "agent", department_id: "" });
      setMemberModal("none");
    } catch { /* toast handled in hook */ }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inv.email.trim()) return;
    if (["agent", "viewer"].includes(inv.role) && !inv.department_id) {
      toast.error("Los agentes y visores deben tener un departamento asignado");
      return;
    }
    try {
      await invite.mutateAsync({ email: inv.email.trim(), role: inv.role, department_id: inv.department_id || null });
      toast.success(`Invitación enviada a ${inv.email}`);
      setInv({ email: "", role: "agent", department_id: "" });
      setMemberModal("none");
    } catch { toast.error("No se pudo enviar la invitación"); }
  };

  const handleToggleActive = async (memberId: string, active: boolean) => {
    try {
      await updateMember.mutateAsync({ memberId, active });
      toast.success(active ? "Miembro activado" : "Miembro desactivado");
    } catch { toast.error("No se pudo actualizar el miembro"); }
  };

  const handleChangeRole = async (memberId: string, role: "admin" | "agent" | "viewer") => {
    try {
      await updateMember.mutateAsync({ memberId, role });
      toast.success("Rol actualizado");
    } catch { toast.error("No se pudo cambiar el rol"); }
  };

  const handleChangeDept = async (memberId: string, department_id: string | null) => {
    try {
      await updateMember.mutateAsync({ memberId, department_id });
      toast.success("Departamento actualizado");
    } catch { toast.error("No se pudo actualizar el departamento"); }
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await updateDept.mutateAsync({ deptId: editingDept, ...deptForm });
      } else {
        await createDept.mutateAsync(deptForm);
      }
      setDeptForm({ name: "", description: "", color: "#6366f1" });
      setShowDeptForm(false);
      setEditingDept(null);
    } catch { /* toast handled in hook */ }
  };

  const handleEditDept = (dept: typeof departments[0]) => {
    setDeptForm({ name: dept.name, description: dept.description, color: dept.color });
    setEditingDept(dept._id);
    setShowDeptForm(true);
  };

  const handleDeleteDept = async (deptId: string, name: string) => {
    if (!confirm(`¿Eliminar el departamento "${name}"? Los miembros quedarán sin departamento.`)) return;
    await deleteDept.mutateAsync(deptId);
  };

  const filteredMembers = deptFilter === "all"
    ? members
    : deptFilter === "none"
      ? members.filter(m => !m.department)
      : members.filter(m => m.department?._id === deptFilter);

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold">Equipo</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona miembros y departamentos del workspace.
          </p>
        </div>
        {tab === "members" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setMemberModal(memberModal === "invite" ? "none" : "invite")}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Invitar
            </Button>
            <Button size="sm" onClick={() => setMemberModal(memberModal === "create" ? "none" : "create")}>
              <Plus className="h-4 w-4 mr-1.5" />
              Crear miembro
            </Button>
          </div>
        )}
        {tab === "departments" && (
          <Button size="sm" onClick={() => { setShowDeptForm(!showDeptForm); setEditingDept(null); setDeptForm({ name: "", description: "", color: "#6366f1" }); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo departamento
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b">
        {([["members","Miembros"], ["departments","Departamentos"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {id === "members"     && <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{members.length}</span>}
            {id === "departments" && <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{departments.length}</span>}
          </button>
        ))}
      </div>

      {/* ── TAB: MIEMBROS ── */}
      {tab === "members" && (
        <>
          {/* Modal crear miembro */}
          {memberModal === "create" && (
            <form onSubmit={handleCreateMember} className="rounded-lg border bg-muted/30 p-4 mb-5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> Crear nuevo miembro</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Nombre completo" value={cm.name} onChange={e => setCm(p => ({...p, name: e.target.value}))} required />
                <Input type="email" placeholder="correo@empresa.com" value={cm.email} onChange={e => setCm(p => ({...p, email: e.target.value}))} required />
              </div>
              <Input type="password" placeholder="Contraseña (mín. 6 caracteres)" value={cm.password} onChange={e => setCm(p => ({...p, password: e.target.value}))} required minLength={6} />
              <div className="flex gap-2">
                <Select value={cm.role} onValueChange={v => setCm(p => ({...p, role: v as typeof cm.role}))}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agente</SelectItem>
                    <SelectItem value="viewer">Visor</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={cm.department_id} onValueChange={v => setCm(p => ({...p, department_id: v ?? ""}))}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Sin departamento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin departamento</SelectItem>
                    {departments.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" size="sm" variant="ghost" onClick={() => setMemberModal("none")}><X className="h-4 w-4" /></Button>
                <Button type="submit" size="sm" disabled={createMember.isPending}>
                  {createMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  Crear
                </Button>
              </div>
            </form>
          )}

          {/* Modal invitar miembro */}
          {memberModal === "invite" && (
            <form onSubmit={handleInvite} className="rounded-lg border bg-muted/30 p-4 mb-5 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-1.5"><UserPlus className="h-4 w-4" /> Invitar por email</p>
              <div className="flex gap-2">
                <Input type="email" placeholder="correo@empresa.com" value={inv.email} onChange={e => setInv(p => ({...p, email: e.target.value}))} className="flex-1" required />
                <Select value={inv.role} onValueChange={v => setInv(p => ({...p, role: v as typeof inv.role}))}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="agent">Agente</SelectItem>
                    <SelectItem value="viewer">Visor</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={inv.department_id} onValueChange={v => setInv(p => ({...p, department_id: v ?? ""}))}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Departamento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin departamento</SelectItem>
                    {departments.map(d => <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" size="sm" variant="ghost" onClick={() => setMemberModal("none")}><X className="h-4 w-4" /></Button>
                <Button type="submit" size="sm" disabled={invite.isPending}>
                  {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  Invitar
                </Button>
              </div>
            </form>
          )}

          {/* Filtro por departamento */}
          {departments.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-4">
              {[{_id: "all", name: "Todos"}, {_id: "none", name: "Sin departamento"}, ...departments].map(d => (
                <button
                  key={d._id}
                  onClick={() => setDeptFilter(d._id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    deptFilter === d._id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  {d.name}
                  {"members_count" in d && <span className="ml-1 opacity-60">{(d as any).members_count}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Lista de miembros */}
          {loadingMembers ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((member) => {
                const isMe    = (member.user as any)?._id === currentUserId;
                const isOwner = member.role === "owner";
                const user    = member.user as any;
                const initials = (user?.name ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

                return (
                  <div key={member._id} className={`flex items-center gap-3 rounded-lg border p-3 ${!member.active ? "opacity-50" : ""}`}>
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0 overflow-hidden">
                      {user?.avatar_url ? <img src={user.avatar_url} className="h-full w-full object-cover" alt={user.name} /> : initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        {isMe && <span className="text-xs text-muted-foreground">(tú)</span>}
                        {!member.active && <Badge variant="outline" className="text-xs py-0">Inactivo</Badge>}
                        {member.department && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: member.department.color + "22", color: member.department.color }}>
                            {member.department.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Cambiar departamento */}
                      {!isOwner && !isMe && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground transition-colors" title="Cambiar departamento">
                            <Building2 className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleChangeDept(member._id, null)}>
                              {!member.department && <Check className="h-3.5 w-3.5 mr-1.5" />}
                              Sin departamento
                            </DropdownMenuItem>
                            {departments.map(d => (
                              <DropdownMenuItem key={d._id} onClick={() => handleChangeDept(member._id, d._id)}>
                                {member.department?._id === d._id && <Check className="h-3.5 w-3.5 mr-1.5" />}
                                <span className="h-2 w-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: d.color }} />
                                {d.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {/* Cambiar rol */}
                      {isOwner || isMe ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role]}`}>{ROLE_LABELS[member.role]}</span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role]} hover:opacity-80 transition-opacity`}>
                            {ROLE_LABELS[member.role]}
                            <ChevronDown className="h-3 w-3" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(["admin", "agent", "viewer"] as const).map((r) => (
                              <DropdownMenuItem key={r} onClick={() => handleChangeRole(member._id, r)}>
                                {member.role === r && <Check className="h-3.5 w-3.5 mr-1.5" />}
                                {ROLE_LABELS[r]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {/* Activar/desactivar */}
                      {!isOwner && !isMe && (
                        <button
                          onClick={() => handleToggleActive(member._id, !member.active)}
                          disabled={updateMember.isPending}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={member.active ? "Desactivar acceso" : "Reactivar acceso"}
                        >
                          <Shield className={`h-4 w-4 ${member.active ? "text-green-500" : ""}`} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No hay miembros en este filtro.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── TAB: DEPARTAMENTOS ── */}
      {tab === "departments" && (
        <>
          {/* Formulario crear/editar */}
          {showDeptForm && (
            <form onSubmit={handleSaveDept} className="rounded-lg border bg-muted/30 p-4 mb-5 space-y-3">
              <p className="text-sm font-semibold">{editingDept ? "Editar departamento" : "Nuevo departamento"}</p>
              <Input placeholder="Nombre del departamento" value={deptForm.name} onChange={e => setDeptForm(p => ({...p, name: e.target.value}))} required minLength={2} />
              <Input placeholder="Descripción (opcional)" value={deptForm.description} onChange={e => setDeptForm(p => ({...p, description: e.target.value}))} />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {DEPT_COLORS.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setDeptForm(p => ({...p, color: c}))}
                      className={`h-6 w-6 rounded-full border-2 transition-transform ${deptForm.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" size="sm" variant="ghost" onClick={() => { setShowDeptForm(false); setEditingDept(null); }}><X className="h-4 w-4" /></Button>
                <Button type="submit" size="sm" disabled={createDept.isPending || updateDept.isPending}>
                  {(createDept.isPending || updateDept.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  {editingDept ? "Guardar cambios" : "Crear departamento"}
                </Button>
              </div>
            </form>
          )}

          {/* Lista de departamentos */}
          {loadingDepts ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay departamentos aún.</p>
              <p className="text-xs mt-1">Crea uno para organizar tu equipo.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {departments.map(dept => (
                <div key={dept._id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: dept.color + "22" }}>
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dept.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{dept.name}</p>
                    {dept.description && <p className="text-xs text-muted-foreground truncate">{dept.description}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {dept.members_count} {dept.members_count === 1 ? "miembro" : "miembros"}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleEditDept(dept)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteDept(dept._id, dept.name)} disabled={deleteDept.isPending} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Eliminar">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── BillingSection ───────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  free:       "bg-muted text-muted-foreground",
  starter:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pro:        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  enterprise: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  trialing:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  past_due:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  canceled:  "bg-muted text-muted-foreground",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  active:    "Activo",
  trialing:  "Trial",
  past_due:  "Pago vencido",
  canceled:  "Cancelado",
  suspended: "Suspendido",
};

const INVOICE_STATUS: Record<string, string> = {
  paid:          "Pagada",
  open:          "Pendiente",
  draft:         "Borrador",
  void:          "Anulada",
  uncollectible: "Incobrable",
};

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const danger = pct >= 90;
  const warn   = pct >= 70 && !danger;

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={danger ? "text-destructive font-medium" : warn ? "text-amber-500 font-medium" : "text-muted-foreground"}>
          {used.toLocaleString()} / {unlimited ? "∞" : limit.toLocaleString()}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${danger ? "bg-destructive" : warn ? "bg-amber-500" : "bg-primary"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function BillingSection() {
  const { data: plan, isLoading: planLoading } = useWorkspacePlan();
  const { data: invoicesData, isLoading: invoicesLoading } = useWorkspaceInvoices();
  const checkout = useCheckout();
  const portal = useBillingPortal();
  const applyCoupon = useApplyCoupon();

  const [couponInput, setCouponInput] = useState("");
  const [selectedTier, setSelectedTier] = useState<"starter" | "pro" | "enterprise">("pro");
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "yearly">("monthly");

  if (planLoading) return <SectionSkeleton />;

  const trialDaysLeft = plan?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(plan.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : null;

  const hasStripe = !!plan?.stripe_cus_id;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <SectionHeader
        title="Facturación"
        description="Gestiona tu plan, uso y métodos de pago."
      />

      {/* Trial banner */}
      {plan?.status === "trialing" && trialDaysLeft !== null && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 px-4 py-3">
          <Gift className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {trialDaysLeft > 0
              ? `Tu trial vence en ${trialDaysLeft} día${trialDaysLeft !== 1 ? "s" : ""}. Actualiza tu plan para no perder el acceso.`
              : "Tu trial ha expirado. Actualiza tu plan para continuar."}
          </p>
        </div>
      )}

      {/* Past due warning */}
      {plan?.status === "past_due" && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            Hay un problema con tu método de pago. Actualiza tu información de facturación para mantener el acceso.
          </p>
        </div>
      )}

      {/* Plan actual */}
      <div className="rounded-lg border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Plan actual</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TIER_COLORS[plan?.tier ?? "free"]}`}>
                {plan?.tier ?? "free"}
              </span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[plan?.status ?? "active"]}`}>
                {STATUS_LABEL[plan?.status ?? "active"]}
              </span>
              {plan?.billing_cycle && (
                <span className="text-xs text-muted-foreground capitalize">· {plan.billing_cycle === "yearly" ? "anual" : "mensual"}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {hasStripe && (
              <Button
                variant="outline"
                size="sm"
                disabled={portal.isPending}
                onClick={() => portal.mutate()}
              >
                {portal.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Gestionar facturación
              </Button>
            )}
          </div>
        </div>

        {/* Coupon applied */}
        {plan?.coupon_applied && (
          <p className="text-xs text-muted-foreground">
            Cupón aplicado: <span className="font-mono font-medium">{plan.coupon_applied}</span>
          </p>
        )}

        {/* Next billing */}
        {plan?.next_billing_date && (
          <p className="text-xs text-muted-foreground">
            Próxima factura: {new Date(plan.next_billing_date).toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Uso vs límites */}
      {plan && (
        <div className="rounded-lg border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Uso del mes actual</p>
          </div>
          <div className="space-y-3">
            <UsageBar
              label="Conversaciones"
              used={plan.usage?.conversations_this_month ?? 0}
              limit={plan.limits?.conversations_per_month ?? -1}
            />
            <UsageBar
              label="Agentes"
              used={plan.usage?.agents ?? 0}
              limit={plan.limits?.agents ?? -1}
            />
            <UsageBar
              label="Canales"
              used={plan.usage?.channels ?? 0}
              limit={plan.limits?.channels ?? -1}
            />
            <UsageBar
              label="Knowledge items"
              used={plan.usage?.knowledge_items ?? 0}
              limit={plan.limits?.knowledge_items ?? -1}
            />
            <UsageBar
              label="Bots"
              used={plan.usage?.bots ?? 0}
              limit={plan.limits?.bots ?? -1}
            />
          </div>
        </div>
      )}

      {/* Actualizar plan */}
      {plan?.tier === "free" || plan?.status === "trialing" || plan?.status === "canceled" ? (
        <div className="rounded-lg border p-5 space-y-4">
          <p className="text-sm font-medium">Actualizar plan</p>
          <div className="flex gap-3">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as typeof selectedTier)}
              className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value as typeof selectedCycle)}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual (ahorra 20%)</option>
            </select>
            <Button
              disabled={checkout.isPending}
              onClick={() => checkout.mutate({ tier: selectedTier, billing_cycle: selectedCycle })}
            >
              {checkout.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Pagar con Stripe
            </Button>
          </div>
        </div>
      ) : null}

      {/* Aplicar cupón */}
      <div className="rounded-lg border p-5 space-y-3">
        <p className="text-sm font-medium">Aplicar cupón</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            className="h-9 flex-1 rounded-md border bg-background px-3 font-mono text-sm uppercase placeholder-muted-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            variant="outline"
            disabled={!couponInput.trim() || applyCoupon.isPending}
            onClick={() => {
              applyCoupon.mutate(couponInput.trim(), {
                onSuccess: () => setCouponInput(""),
              });
            }}
          >
            {applyCoupon.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Aplicar
          </Button>
        </div>
      </div>

      {/* Historial de facturas */}
      <div className="rounded-lg border">
        <div className="border-b px-5 py-3">
          <p className="text-sm font-medium">Historial de facturas</p>
        </div>
        {invoicesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !invoicesData?.invoices?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay facturas registradas
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Período</th>
                <th className="px-5 py-2.5 text-right font-medium">Monto</th>
                <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                <th className="px-5 py-2.5 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoicesData.invoices.map((inv) => (
                <tr key={inv._id} className="border-b last:border-0">
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(inv.period_start).toLocaleDateString("es", { month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: inv.currency?.toUpperCase() || "USD" }).format(inv.amount / 100)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      inv.status === "paid" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      inv.status === "open" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {INVOICE_STATUS[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {inv.pdf_url && (
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          PDF
                        </a>
                      )}
                      {inv.invoice_url && (
                        <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
