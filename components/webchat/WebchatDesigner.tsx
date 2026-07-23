"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateChannel } from "@/lib/hooks/useChannels";
import { WidgetPreview } from "./WidgetPreview";
import type { WidgetPreviewDesign } from "./WidgetPreview";

type DesignConfig = Required<WidgetPreviewDesign>;

interface WebchatDesignerProps {
  channelId: string;
  workspaceId: string;
  initialDesign?: Partial<DesignConfig>;
  onSaved?: () => void;
}

const DEFAULTS: Partial<DesignConfig> = {
  primary_color:    "#6366f1",
  text_color:       "#ffffff",
  position:         "bottom-right",
  launcher_size:    "medium",
  show_unread_badge: true,
  font_family:      "system",
  border_radius:    "medium",
};

function RadioGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              value === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-foreground hover:border-primary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 font-mono text-sm"
          maxLength={7}
          placeholder="#6366f1"
        />
        <div
          className="h-9 w-9 rounded-lg border border-border shadow-sm transition-colors"
          style={{ backgroundColor: value }}
        />
      </div>
    </div>
  );
}

export function WebchatDesigner({
  channelId,
  workspaceId: _workspaceId,
  initialDesign,
  onSaved,
}: WebchatDesignerProps) {
  const [design, setDesign] = useState<Partial<DesignConfig>>({
    ...DEFAULTS,
    ...initialDesign,
  });
  const updateChannel = useUpdateChannel();

  const set = <K extends keyof DesignConfig>(key: K, value: DesignConfig[K]) =>
    setDesign((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await updateChannel.mutateAsync({
        channelId,
        design,
      });
      toast.success("Diseño guardado correctamente");
      onSaved?.();
    } catch {
      toast.error("No se pudo guardar el diseño");
    }
  };

  const isSaving = updateChannel.isPending;

  return (
    <div className="flex gap-6 flex-col xl:flex-row">
      {/* ── Controles ── */}
      <div className="flex-1 space-y-5 min-w-0">
        <ColorField
          label="Color del widget"
          value={design.primary_color ?? "#6366f1"}
          onChange={(v) => set("primary_color", v)}
        />

        <ColorField
          label="Color del texto del encabezado"
          value={design.text_color ?? "#ffffff"}
          onChange={(v) => set("text_color", v)}
        />

        <RadioGroup
          label="Posición"
          value={design.position ?? "bottom-right"}
          onChange={(v) => set("position", v)}
          options={[
            { value: "bottom-right", label: "Derecha ↘" },
            { value: "bottom-left",  label: "Izquierda ↙" },
          ]}
        />

        <RadioGroup
          label="Tamaño del launcher"
          value={design.launcher_size ?? "medium"}
          onChange={(v) => set("launcher_size", v)}
          options={[
            { value: "small",  label: "Pequeño" },
            { value: "medium", label: "Mediano" },
            { value: "large",  label: "Grande" },
          ]}
        />

        <div className="space-y-1.5">
          <Label>Nombre del bot</Label>
          <Input
            value={design.bot_display_name ?? ""}
            onChange={(e) => set("bot_display_name", e.target.value)}
            placeholder="Asistente"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Subtítulo</Label>
          <Input
            value={design.bot_subtitle ?? ""}
            onChange={(e) => set("bot_subtitle", e.target.value)}
            placeholder="En línea"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Mensaje de bienvenida</Label>
          <Input
            value={design.welcome_message ?? ""}
            onChange={(e) => set("welcome_message", e.target.value)}
            placeholder="¿Necesitas ayuda?"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Badge de no leídos</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Muestra un indicador rojo sobre el launcher.
            </p>
          </div>
          <Switch
            checked={design.show_unread_badge ?? true}
            onCheckedChange={(v) => set("show_unread_badge", v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Familia tipográfica</Label>
          <Select
            value={design.font_family ?? "system"}
            onValueChange={(v) => set("font_family", v as DesignConfig["font_family"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="roboto">Roboto</SelectItem>
              <SelectItem value="poppins">Poppins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Radio de bordes</Label>
          <Select
            value={design.border_radius ?? "medium"}
            onValueChange={(v) => set("border_radius", v as DesignConfig["border_radius"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin bordes</SelectItem>
              <SelectItem value="small">Pequeño</SelectItem>
              <SelectItem value="medium">Mediano</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar diseño
        </Button>
      </div>

      {/* ── Preview ── */}
      <div className="xl:w-72 shrink-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Preview en tiempo real
        </p>
        <WidgetPreview design={design} />
      </div>
    </div>
  );
}
