"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Users, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useChannels } from "@/lib/hooks/useChannels";
import {
  useCreateCampaign, useLaunchCampaign, usePreviewAudience,
  type CampaignType, type CampaignAudience, type CampaignTemplate,
} from "@/lib/hooks/useCampaigns";

const STEPS = ["Canal y tipo", "Audiencia", "Mensaje", "Programación", "Revisión"];

const CAMPAIGN_CHANNELS = ["whatsapp", "telegram", "email", "facebook_messenger", "instagram_dm"];
const CHANNEL_LABELS: Record<string, string> = {
  whatsapp:           "📱 WhatsApp",
  telegram:           "✈️ Telegram",
  email:              "📧 Email",
  facebook_messenger: "💬 Facebook Messenger",
  instagram_dm:       "📸 Instagram DM",
};
const TYPE_INFO: Record<CampaignType, { label: string; desc: string }> = {
  immediate: { label: "Inmediata",  desc: "Envío único a toda la audiencia ahora o en una fecha" },
  drip:      { label: "Drip",       desc: "Secuencia de mensajes separados por días" },
  trigger:   { label: "Trigger",    desc: "Disparada automáticamente por un evento (inactividad, cumpleaños)" },
};

interface WizardProps {
  onDone:   (id: string) => void;
  onCancel: () => void;
}

export function CampaignWizard({ onDone, onCancel }: WizardProps) {
  const [step, setStep] = useState(0);

  // Step 1
  const [name,      setName]      = useState("");
  const [channelId, setChannelId] = useState("");
  const [type,      setType]      = useState<CampaignType>("immediate");

  // Step 2
  const [audienceType, setAudienceType] = useState<"all" | "segment">("all");
  const [hasPhone,  setHasPhone]  = useState(false);
  const [hasEmail,  setHasEmail]  = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  // Step 3
  const [templateType, setTemplateType] = useState<"text" | "hsm">("text");
  const [content,   setContent]   = useState("");
  const [subject,   setSubject]   = useState("");
  const [abEnabled, setAbEnabled] = useState(false);
  const [contentB,  setContentB]  = useState("");
  const [hsmName,   setHsmName]   = useState("");

  // Step 4
  const [sendNow,  setSendNow]  = useState(true);
  const [sendAt,   setSendAt]   = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");
  const [hourStart, setHourStart] = useState(8);
  const [hourEnd,   setHourEnd]   = useState(20);

  // Step 5 — drip steps
  const [dripSteps, setDripSteps] = useState<Array<{ delay_days: number; content: string }>>([
    { delay_days: 0, content: "" }, { delay_days: 3, content: "" },
  ]);

  // Trigger
  const [triggerEvent, setTriggerEvent]       = useState("inactivity");
  const [inactivityDays, setInactivityDays]   = useState(30);

  const { data: channelsData, isLoading: loadingChannels } = useChannels();
  const channels = (channelsData ?? []).filter((c) => CAMPAIGN_CHANNELS.includes(c.type) && c.active);

  const selectedChannel = channels.find((c) => c._id === channelId);

  const createCampaign  = useCreateCampaign();
  const launchCampaign  = useLaunchCampaign();
  const previewAudience = usePreviewAudience();

  const handlePreviewAudience = async () => {
    if (!channelId) return;
    const audience: Partial<CampaignAudience> = {
      type: audienceType,
      filters: { has_phone: hasPhone || undefined, has_email: hasEmail || undefined },
    };
    const res = await previewAudience.mutateAsync({ channel_id: channelId, audience });
    setPreviewCount(res.count);
  };

  const buildPayload = () => {
    const audience: CampaignAudience = {
      type: audienceType,
      filters: {
        has_phone: hasPhone || undefined,
        has_email: hasEmail || undefined,
      },
    };

    const template: CampaignTemplate = {
      type:            templateType,
      content,
      subject:         subject || undefined,
      hsm_name:        hsmName || undefined,
      content_b:       abEnabled ? contentB : undefined,
      ab_test_enabled: abEnabled || undefined,
    };

    const schedule = {
      send_at:       (!sendNow && sendAt) ? sendAt : null,
      timezone,
      allowed_hours: { start: hourStart, end: hourEnd },
    };

    const drip = type === "drip"
      ? dripSteps.map((s) => ({ delay_days: s.delay_days, template: { type: "text" as const, content: s.content } }))
      : undefined;

    const trigger = type === "trigger"
      ? { event: triggerEvent, inactivity_days: triggerEvent === "inactivity" ? inactivityDays : undefined }
      : undefined;

    return { name, channel_id: channelId, type, audience, template, schedule, drip_steps: drip, trigger };
  };

  const handleFinish = async (launch: boolean) => {
    const payload = buildPayload();
    const campaign = await createCampaign.mutateAsync(payload as never);
    if (launch) {
      await launchCampaign.mutateAsync(campaign._id);
    }
    onDone(campaign._id);
  };

  const isSaving = createCampaign.isPending || launchCampaign.isPending;
  const canNext = [
    !!name && !!channelId,
    true,
    type === "drip" ? dripSteps.every((s) => s.content) : !!content,
    true,
    true,
  ][step];

  return (
    <div className="flex flex-col h-full">
      {/* Progress */}
      <div className="px-6 pt-6 pb-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Nueva campaña</h2>
          <span className="text-xs text-muted-foreground">Paso {step + 1} de {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-sm font-medium mt-2">{STEPS[step]}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── Step 0: Canal y tipo ────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label>Nombre de la campaña</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Black Friday 2026" />
            </div>

            <div className="space-y-1.5">
              <Label>Canal de envío</Label>
              {loadingChannels ? (
                <Skeleton className="h-10 w-full" />
              ) : !channels.length ? (
                <p className="text-sm text-muted-foreground border rounded-md p-3">
                  No hay canales activos. Configura uno en Ajustes → Canales.
                </p>
              ) : (
                <Select value={channelId} onValueChange={(v) => setChannelId(v ?? "")}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un canal..." /></SelectTrigger>
                  <SelectContent>
                    {channels.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {CHANNEL_LABELS[c.type] ?? c.type} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de campaña</Label>
              <div className="grid grid-cols-1 gap-2">
                {(Object.entries(TYPE_INFO) as [CampaignType, typeof TYPE_INFO[CampaignType]][]).map(([t, info]) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`text-left rounded-lg border p-3 transition-colors ${
                      type === t ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <p className="text-sm font-medium">{info.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Audiencia ───────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Tipo de audiencia</Label>
              {(["all", "segment"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAudienceType(t)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    audienceType === t ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                  }`}
                >
                  <p className="text-sm font-medium">{t === "all" ? "Todos los contactos" : "Segmento con filtros"}</p>
                  <p className="text-xs text-muted-foreground">
                    {t === "all" ? "Se envía a todos los contactos activos del workspace" : "Filtra por condiciones específicas"}
                  </p>
                </button>
              ))}
            </div>

            {audienceType === "segment" && (
              <div className="space-y-3 border rounded-lg p-4">
                <p className="text-sm font-medium">Filtros</p>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Tiene teléfono</Label>
                  <Switch checked={hasPhone} onCheckedChange={setHasPhone} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Tiene email</Label>
                  <Switch checked={hasEmail} onCheckedChange={setHasEmail} />
                </div>
              </div>
            )}

            {type === "trigger" && (
              <div className="space-y-3 border rounded-lg p-4">
                <p className="text-sm font-medium">Configuración del trigger</p>
                <div className="space-y-1.5">
                  <Label>Evento disparador</Label>
                  <Select value={triggerEvent} onValueChange={(v) => setTriggerEvent(v ?? "")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inactivity">Inactividad del contacto</SelectItem>
                      <SelectItem value="birthday">Cumpleaños</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {triggerEvent === "inactivity" && (
                  <div className="space-y-1.5">
                    <Label>Días de inactividad</Label>
                    <Input
                      type="number" min={1}
                      value={inactivityDays}
                      onChange={(e) => setInactivityDays(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              variant="outline" size="sm"
              onClick={handlePreviewAudience}
              disabled={!channelId || previewAudience.isPending}
            >
              {previewAudience.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              Ver tamaño de audiencia
            </Button>
            {previewCount !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span><strong>{previewCount.toLocaleString()}</strong> contactos elegibles</span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Mensaje ─────────────────────────────────────────────── */}
        {step === 2 && type !== "drip" && (
          <div className="space-y-5">
            {selectedChannel?.type === "whatsapp" && (
              <div className="space-y-2">
                <Label>Tipo de mensaje</Label>
                <div className="flex gap-2">
                  {(["text", "hsm"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTemplateType(t)}
                      className={`flex-1 rounded-lg border p-2.5 text-sm text-center transition-colors ${
                        templateType === t ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/40"
                      }`}
                    >
                      {t === "text" ? "Texto libre" : "Plantilla HSM"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {templateType === "hsm" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Nombre de la plantilla HSM</Label>
                  <Input value={hsmName} onChange={(e) => setHsmName(e.target.value)} placeholder="hello_world" className="font-mono" />
                </div>
                <p className="text-xs text-muted-foreground">
                  La plantilla debe estar aprobada por Meta. Los parámetros se configuran en el payload HSM.
                </p>
              </div>
            ) : (
              <>
                {selectedChannel?.type === "email" && (
                  <div className="space-y-1.5">
                    <Label>Asunto del email</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Oferta especial para ti" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Mensaje</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={"Hola {{nombre}}, tenemos una oferta especial para ti..."}
                    rows={5}
                    className="resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Variables: {"{{nombre}}"} {"{{email}}"} {"{{telefono}}"} {"{{empresa}}"}</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">A/B Testing</p>
                    <p className="text-xs text-muted-foreground">Prueba dos versiones del mensaje</p>
                  </div>
                  <Switch checked={abEnabled} onCheckedChange={setAbEnabled} />
                </div>

                {abEnabled && (
                  <div className="space-y-1.5">
                    <Label>Mensaje versión B</Label>
                    <Textarea
                      value={contentB}
                      onChange={(e) => setContentB(e.target.value)}
                      placeholder="Hola {{nombre}}, no te pierdas esta oportunidad..."
                      rows={4}
                      className="resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">50% de la audiencia recibe la versión A y 50% la versión B</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Mensaje drip ─────────────────────────────────────────── */}
        {step === 2 && type === "drip" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Define la secuencia de mensajes. El día 0 se envía al lanzar.</p>
            {dripSteps.map((s, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="shrink-0">Paso {i + 1}</Badge>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Día</span>
                    <Input
                      type="number" min={0}
                      className="w-16 h-7 text-sm"
                      value={s.delay_days}
                      onChange={(e) => setDripSteps((prev) => prev.map((p, j) => j === i ? { ...p, delay_days: Number(e.target.value) } : p))}
                    />
                    <span className="text-muted-foreground">desde el lanzamiento</span>
                  </div>
                  {dripSteps.length > 1 && (
                    <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive"
                      onClick={() => setDripSteps((prev) => prev.filter((_, j) => j !== i))}>
                      Quitar
                    </Button>
                  )}
                </div>
                <Textarea
                  value={s.content}
                  onChange={(e) => setDripSteps((prev) => prev.map((p, j) => j === i ? { ...p, content: e.target.value } : p))}
                  placeholder={`Mensaje del paso ${i + 1}...`}
                  rows={3}
                  className="resize-none font-mono text-sm"
                />
              </div>
            ))}
            <Button variant="outline" size="sm"
              onClick={() => setDripSteps((prev) => [...prev, { delay_days: (prev.at(-1)?.delay_days ?? 0) + 7, content: "" }])}>
              + Agregar paso
            </Button>
          </div>
        )}

        {/* ── Step 3: Programación ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            {type !== "trigger" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Enviar inmediatamente al lanzar</p>
                    <p className="text-xs text-muted-foreground">Sin programación, comienza en cuanto lances</p>
                  </div>
                  <Switch checked={sendNow} onCheckedChange={setSendNow} />
                </div>
                {!sendNow && (
                  <div className="space-y-1.5">
                    <Label>Fecha y hora de envío</Label>
                    <Input type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <div className="border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Ventana horaria permitida</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Hora inicio</Label>
                  <Input type="number" min={0} max={23} value={hourStart} onChange={(e) => setHourStart(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Hora fin</Label>
                  <Input type="number" min={0} max={23} value={hourEnd} onChange={(e) => setHourEnd(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Zona horaria</Label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/Bogota" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Revisión ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Revisa los detalles antes de crear o lanzar.</p>
            <div className="rounded-lg border divide-y text-sm">
              {[
                ["Nombre",    name],
                ["Canal",     selectedChannel ? `${CHANNEL_LABELS[selectedChannel.type]} — ${selectedChannel.name}` : "—"],
                ["Tipo",      TYPE_INFO[type]?.label],
                ["Audiencia", audienceType === "all" ? "Todos los contactos" : "Segmento filtrado"],
                ["Mensaje",   content ? content.slice(0, 60) + (content.length > 60 ? "…" : "") : hsmName || "—"],
                ["Envío",     sendNow ? "Inmediato al lanzar" : (sendAt ? new Date(sendAt).toLocaleString("es-CO") : "Inmediato")],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-3 px-4 py-2.5">
                  <span className="text-muted-foreground w-24 shrink-0">{k}</span>
                  <span className="font-medium truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="border-t px-6 py-4 flex items-center gap-2">
        {step > 0 ? (
          <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />Anterior
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        )}
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => handleFinish(false)} disabled={isSaving}>
              {createCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Guardar borrador
            </Button>
            <Button size="sm" onClick={() => handleFinish(true)} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Crear y lanzar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
