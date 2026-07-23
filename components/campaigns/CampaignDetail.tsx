"use client";

import { useState } from "react";
import {
  Play, Pause, XCircle, Trash2, BarChart2, Users, CheckCircle2,
  Mail, MessageSquare, AlertCircle, Ban, RefreshCw, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignStatusBadge } from "./CampaignStatusBadge";
import {
  useCampaign, useCampaignStats, useCampaignContacts,
  useLaunchCampaign, usePauseCampaign, useCancelCampaign, useDeleteCampaign,
  type ContactStatus,
} from "@/lib/hooks/useCampaigns";
import { cn } from "@/lib/utils";

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "📱", telegram: "✈️", email: "📧",
  facebook_messenger: "💬", instagram_dm: "📸",
};

const TYPE_LABELS: Record<string, string> = {
  immediate: "Inmediata", drip: "Drip", trigger: "Trigger",
};

const CONTACT_STATUS_TABS: { value: ContactStatus | "all"; label: string }[] = [
  { value: "all",       label: "Todos" },
  { value: "pending",   label: "Pendiente" },
  { value: "sent",      label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "read",      label: "Leído" },
  { value: "replied",   label: "Respondido" },
  { value: "failed",    label: "Fallido" },
  { value: "opted_out", label: "Opt-out" },
];

const CONTACT_STATUS_COLORS: Record<string, string> = {
  pending:   "text-muted-foreground",
  sent:      "text-blue-600",
  delivered: "text-cyan-600",
  read:      "text-indigo-600",
  replied:   "text-green-600",
  failed:    "text-red-600",
  opted_out: "text-amber-600",
  skipped:   "text-muted-foreground",
};

interface Props {
  campaignId: string;
  onDeleted?: () => void;
}

export function CampaignDetail({ campaignId, onDeleted }: Props) {
  const [contactTab, setContactTab] = useState<ContactStatus | "all">("all");

  const { data: campaign, isLoading } = useCampaign(campaignId);
  const { data: statsData }           = useCampaignStats(campaignId);
  const { data: contactsData }        = useCampaignContacts(
    campaignId,
    contactTab === "all" ? undefined : contactTab,
  );

  const launch  = useLaunchCampaign();
  const pause   = usePauseCampaign();
  const cancel  = useCancelCampaign();
  const remove  = useDeleteCampaign();

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta campaña permanentemente?")) return;
    await remove.mutateAsync(campaignId);
    onDeleted?.();
  };

  if (isLoading || !campaign) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <div className="grid grid-cols-4 gap-3 mt-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 mt-4" />
      </div>
    );
  }

  const stats = statsData?.stats ?? campaign.stats;
  const rates = statsData?.rates;

  const pct = (n: number) => `${n.toFixed(1)}%`;

  const statCards = [
    {
      label: "Total audiencia",
      value: stats.total.toLocaleString(),
      icon: Users,
      color: "text-slate-600",
      bg: "bg-slate-50 dark:bg-slate-900",
    },
    {
      label: "Enviados",
      value: stats.sent.toLocaleString(),
      sub: rates ? pct(rates.delivery_rate) + " entregados" : undefined,
      icon: Mail,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Leídos",
      value: stats.read.toLocaleString(),
      sub: rates ? pct(rates.read_rate) : undefined,
      icon: CheckCircle2,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
      label: "Respuestas",
      value: stats.replied.toLocaleString(),
      sub: rates ? pct(rates.reply_rate) : undefined,
      icon: MessageSquare,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Fallidos",
      value: stats.failed.toLocaleString(),
      sub: rates ? pct(rates.fail_rate) : undefined,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Opt-out",
      value: stats.opted_out.toLocaleString(),
      sub: rates ? pct(rates.opt_out_rate) : undefined,
      icon: Ban,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
  ];

  const progress = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
  const abEnabled = campaign.template.ab_test_enabled;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{CHANNEL_ICONS[campaign.channel_type] ?? "📣"}</span>
              <h1 className="text-lg font-semibold truncate">{campaign.name}</h1>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {TYPE_LABELS[campaign.type]} ·{" "}
              {new Date(campaign.createdAt).toLocaleDateString("es-CO", {
                day: "numeric", month: "long", year: "numeric",
              })}
              {campaign.launched_at && (
                <> · Lanzada {new Date(campaign.launched_at).toLocaleDateString("es-CO")}</>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {campaign.status === "draft" && (
              <Button size="sm" onClick={() => launch.mutate(campaignId)} disabled={launch.isPending}>
                <Play className="h-3.5 w-3.5 mr-1" />Lanzar
              </Button>
            )}
            {campaign.status === "running" && (
              <Button size="sm" variant="outline" onClick={() => pause.mutate(campaignId)} disabled={pause.isPending}>
                <Pause className="h-3.5 w-3.5 mr-1" />Pausar
              </Button>
            )}
            {campaign.status === "paused" && (
              <>
                <Button size="sm" onClick={() => launch.mutate(campaignId)} disabled={launch.isPending}>
                  <Play className="h-3.5 w-3.5 mr-1" />Reanudar
                </Button>
                <Button size="sm" variant="outline" onClick={() => cancel.mutate(campaignId)} disabled={cancel.isPending}>
                  <XCircle className="h-3.5 w-3.5 mr-1" />Cancelar
                </Button>
              </>
            )}
            {(campaign.status === "draft" || campaign.status === "cancelled") && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDelete} disabled={remove.isPending}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Progress bar (running/completed) */}
        {(campaign.status === "running" || campaign.status === "completed") && stats.total > 0 && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                {stats.sent.toLocaleString()} de {stats.total.toLocaleString()} enviados
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {statCards.map((card) => (
            <div key={card.label} className={cn("rounded-lg p-3 border", card.bg)}>
              <div className="flex items-center gap-2 mb-1">
                <card.icon className={cn("h-4 w-4", card.color)} />
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              <p className={cn("text-2xl font-bold", card.color)}>{card.value}</p>
              {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
            </div>
          ))}
        </div>

        {/* A/B Test comparison */}
        {abEnabled && (stats.sent_a > 0 || stats.sent_b > 0) && (
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Comparativa A/B
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {(["a", "b"] as const).map((v) => {
                const sent    = v === "a" ? stats.sent_a    : stats.sent_b;
                const replied = v === "a" ? stats.replied_a : stats.replied_b;
                const replyPct = sent > 0 ? ((replied / sent) * 100).toFixed(1) : "0.0";
                return (
                  <div key={v} className="bg-muted/40 rounded-lg p-3 text-center">
                    <Badge variant="outline" className="mb-2 font-bold">Versión {v.toUpperCase()}</Badge>
                    <p className="text-2xl font-bold">{sent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">enviados</p>
                    <p className="text-lg font-semibold mt-2">{replyPct}%</p>
                    <p className="text-xs text-muted-foreground">tasa respuesta</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Schedule info */}
        {campaign.schedule?.send_at && campaign.status === "scheduled" && (
          <div className="border rounded-lg p-3 flex items-center gap-3 bg-blue-50 dark:bg-blue-950 border-blue-200">
            <Clock className="h-4 w-4 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Programada para</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {new Date(campaign.schedule.send_at).toLocaleString("es-CO", {
                  dateStyle: "full", timeStyle: "short",
                })}
                {campaign.schedule.timezone && ` (${campaign.schedule.timezone})`}
              </p>
            </div>
          </div>
        )}

        {/* Contacts table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Contactos</h3>
          </div>

          <Tabs value={contactTab} onValueChange={(v) => setContactTab(v as ContactStatus | "all")}>
            <div className="px-3 pt-2 border-b overflow-x-auto">
              <TabsList className="h-8 bg-transparent p-0 gap-1 flex">
                {CONTACT_STATUS_TABS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="h-7 text-xs px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={contactTab} className="m-0">
              {!contactsData ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : contactsData.contacts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No hay contactos en este estado
                </div>
              ) : (
                <div className="divide-y max-h-72 overflow-y-auto">
                  {contactsData.contacts.map((cc) => {
                    const contact = typeof cc.contact_id === "object" ? cc.contact_id : null;
                    return (
                      <div key={cc._id} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {contact?.name ?? cc.contact_id as string}
                          </p>
                          {contact?.phone && (
                            <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
                          )}
                        </div>
                        {cc.variant && (
                          <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                            {cc.variant.toUpperCase()}
                          </Badge>
                        )}
                        <span className={cn("text-xs font-medium shrink-0", CONTACT_STATUS_COLORS[cc.status])}>
                          {cc.status}
                        </span>
                        {cc.failed_reason && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={cc.failed_reason}>
                            {cc.failed_reason}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {contactsData && contactsData.total > 100 && (
                <p className="text-center text-xs text-muted-foreground py-2 border-t">
                  Mostrando 100 de {contactsData.total.toLocaleString()} contactos
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Template preview */}
        <div className="border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Mensaje</h3>
          {campaign.template.type === "hsm" ? (
            <div className="space-y-1">
              <Badge variant="outline" className="text-xs">HSM: {campaign.template.hsm_name}</Badge>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.template.content}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded p-3">
              {campaign.template.content}
            </p>
          )}
          {abEnabled && campaign.template.content_b && (
            <div className="mt-3">
              <Badge variant="outline" className="text-xs mb-1">Versión B</Badge>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded p-3">
                {campaign.template.content_b}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
