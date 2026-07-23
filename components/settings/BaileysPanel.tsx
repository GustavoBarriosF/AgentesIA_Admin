"use client";

import { useEffect } from "react";
import { Loader2, Wifi, WifiOff, RefreshCw, Unplug, AlertTriangle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBaileysStatus,
  useBaileysConnect,
  useBaileysDisconnect,
  type BaileysStatus,
} from "@/lib/hooks/useChannels";
import { toast } from "sonner";

interface BaileysRiskWarningProps {
  compact?: boolean;
}

export function BaileysRiskWarning({ compact = false }: BaileysRiskWarningProps) {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <p className="text-sm font-semibold text-amber-800">Canal No Oficial — Riesgos importantes</p>
      </div>
      <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
        <li>Este canal usa WhatsApp Web de forma no oficial (librería Baileys). No está respaldado por WhatsApp/Meta.</li>
        <li>WhatsApp puede bloquear el número en cualquier momento sin previo aviso.</li>
        <li>No apto para volúmenes altos de mensajes — puede activar bloqueos anti-spam.</li>
        <li><strong>No soporta mensajes de audio ni video</strong> — se informará automáticamente al cliente.</li>
        {!compact && (
          <>
            <li>Para uso comercial serio, usa el canal <strong>WhatsApp Business (API Oficial)</strong>.</li>
            <li>La sesión puede desconectarse si el teléfono pierde conexión o se reinicia WhatsApp.</li>
          </>
        )}
      </ul>
    </div>
  );
}

interface BaileysStatusBadgeProps {
  status: BaileysStatus;
  phone?: string | null;
}

function StatusBadgeDisplay({ status, phone }: BaileysStatusBadgeProps) {
  const config: Record<BaileysStatus, { label: string; color: string; icon: React.ElementType }> = {
    disconnected: { label: "Desconectado",  color: "bg-gray-100 text-gray-600 border-gray-200",  icon: WifiOff  },
    connecting:   { label: "Conectando…",   color: "bg-blue-100 text-blue-700 border-blue-200",  icon: Loader2  },
    reconnecting: { label: "Reconectando…", color: "bg-orange-100 text-orange-700 border-orange-200", icon: RefreshCw },
    qr_ready:     { label: "Escanear QR",   color: "bg-amber-100 text-amber-700 border-amber-200", icon: Smartphone },
    connected:    { label: phone ? `Conectado: +${phone}` : "Conectado", color: "bg-green-100 text-green-700 border-green-200", icon: Wifi },
  };

  const cfg = config[status];
  const Icon = cfg.icon;
  const isAnimating = status === "connecting" || status === "reconnecting";

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
      <Icon className={`h-3 w-3 ${isAnimating ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

interface BaileysConnectPanelProps {
  channelId: string;
}

export function BaileysConnectPanel({ channelId }: BaileysConnectPanelProps) {
  const { data, isLoading } = useBaileysStatus(channelId, true);
  const connect    = useBaileysConnect();
  const disconnect = useBaileysDisconnect();

  const status = data?.status ?? "disconnected";
  const qr     = data?.qr    ?? null;
  const phone  = data?.phone  ?? null;

  const handleConnect = async () => {
    try {
      await connect.mutateAsync(channelId);
    } catch {
      toast.error("No se pudo iniciar la conexión");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync(channelId);
      toast.success("WhatsApp desconectado");
    } catch {
      toast.error("No se pudo desconectar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Verificando estado…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-3 border-t mt-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Conexión WhatsApp</p>
          <p className="text-xs text-muted-foreground">
            Conecta tu número de WhatsApp escaneando el código QR.
          </p>
        </div>
        <StatusBadgeDisplay status={status} phone={phone} />
      </div>

      {/* QR Code */}
      {status === "qr_ready" && qr && (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 flex flex-col items-center gap-3">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-amber-900">Escanea este código con WhatsApp</p>
              <p className="text-xs text-amber-700">
                Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-amber-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="WhatsApp QR Code" width={220} height={220} className="rounded-lg" />
            </div>
            <p className="text-[10px] text-amber-600">El código expira en ~60 segundos — si vence, vuelve a conectar.</p>
          </div>
        </div>
      )}

      {/* Reconnecting / connecting spinner */}
      {(status === "connecting" || status === "reconnecting") && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <p className="text-xs text-blue-700">
            {status === "connecting" ? "Iniciando conexión con WhatsApp…" : "Reconectando automáticamente…"}
          </p>
        </div>
      )}

      {/* Connected */}
      {status === "connected" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-600" />
          <p className="text-xs text-green-700">
            WhatsApp conectado correctamente. El número está listo para enviar y recibir mensajes.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {(status === "disconnected") && (
          <Button
            size="sm"
            onClick={handleConnect}
            disabled={connect.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {connect.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              : <Wifi className="h-3.5 w-3.5 mr-1.5" />}
            Conectar WhatsApp
          </Button>
        )}

        {status === "qr_ready" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleConnect}
            disabled={connect.isPending}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerar QR
          </Button>
        )}

        {(status === "connected" || status === "connecting" || status === "reconnecting" || status === "qr_ready") && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDisconnect}
            disabled={disconnect.isPending}
            className="border-destructive/40 text-destructive hover:bg-destructive/5"
          >
            {disconnect.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              : <Unplug className="h-3.5 w-3.5 mr-1.5" />}
            Desconectar
          </Button>
        )}
      </div>

      <BaileysRiskWarning compact />
    </div>
  );
}
