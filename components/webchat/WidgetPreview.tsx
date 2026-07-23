"use client";

export interface WidgetPreviewDesign {
  primary_color?: string;
  text_color?: string;
  position?: "bottom-right" | "bottom-left";
  launcher_size?: "small" | "medium" | "large";
  bot_display_name?: string;
  bot_subtitle?: string;
  welcome_message?: string;
  bot_avatar_url?: string;
  border_radius?: "none" | "small" | "medium" | "large";
  show_unread_badge?: boolean;
  font_family?: "system" | "inter" | "roboto" | "poppins";
  launcher_icon?: "chat" | "help" | "smile" | "custom";
  custom_launcher_icon_url?: string;
}

interface WidgetPreviewProps {
  design: WidgetPreviewDesign;
}

const LAUNCHER_SIZES: Record<string, number> = {
  small: 48,
  medium: 56,
  large: 64,
};

const BORDER_RADIUS_MAP: Record<string, string> = {
  none:   "0px",
  small:  "4px",
  medium: "12px",
  large:  "24px",
};

export function WidgetPreview({ design }: WidgetPreviewProps) {
  const primaryColor  = design.primary_color  ?? "#6366f1";
  const textColor     = design.text_color     ?? "#ffffff";
  const position      = design.position       ?? "bottom-right";
  const launcherSize  = design.launcher_size  ?? "medium";
  const borderRadius  = design.border_radius  ?? "medium";
  const botName       = design.bot_display_name ?? "Asistente";
  const botSubtitle   = design.bot_subtitle   ?? "En línea";
  const welcomeMsg    = design.welcome_message ?? "¿Necesitas ayuda?";
  const showBadge     = design.show_unread_badge ?? true;
  const avatarUrl     = design.bot_avatar_url;

  const sz            = LAUNCHER_SIZES[launcherSize] ?? 52;
  const br            = BORDER_RADIUS_MAP[borderRadius] ?? "16px";
  const isRight       = position === "bottom-right";

  return (
    <div
      className="relative bg-muted/40 border rounded-xl overflow-hidden"
      style={{ height: 320, minWidth: 280 }}
    >
      {/* Label */}
      <p className="absolute top-3 left-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider select-none">
        Vista previa
      </p>

      {/* Chat window (scaled ~60%) */}
      <div
        className="absolute shadow-xl border overflow-hidden flex flex-col"
        style={{
          width: 200,
          height: 210,
          bottom: sz + 12 + 8,
          right: isRight ? 12 : undefined,
          left: isRight ? undefined : 12,
          borderRadius: br,
          background: "#ffffff",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={botName}
              className="rounded-full object-cover shrink-0"
              style={{ width: 26, height: 26 }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center text-xs shrink-0"
              style={{
                width: 26,
                height: 26,
                background: "rgba(255,255,255,0.25)",
                color: textColor,
              }}
            >
              🤖
            </div>
          )}
          <div className="min-w-0">
            <p
              className="text-xs font-semibold leading-none truncate"
              style={{ color: textColor }}
            >
              {botName}
            </p>
            <p
              className="text-[9px] mt-0.5 leading-none truncate opacity-80"
              style={{ color: textColor }}
            >
              {botSubtitle}
            </p>
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 p-2.5 bg-slate-50 overflow-hidden">
          {/* Bot bubble */}
          <div className="flex items-end gap-1.5 max-w-[80%]">
            <div
              className="rounded-full flex items-center justify-center text-[9px] shrink-0"
              style={{
                width: 18,
                height: 18,
                backgroundColor: primaryColor,
                color: textColor,
              }}
            >
              🤖
            </div>
            <div
              className="text-[9px] leading-relaxed px-2 py-1.5 rounded-2xl rounded-bl-none shadow-sm"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#1e293b",
                maxWidth: 130,
              }}
            >
              {welcomeMsg}
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-2 border-t shrink-0"
          style={{ background: "#ffffff" }}
        >
          <div
            className="flex-1 rounded-full text-[8px] text-slate-400 px-2.5 py-1.5 border"
            style={{ background: "#f8fafc" }}
          >
            Escribe un mensaje...
          </div>
          <div
            className="rounded-full flex items-center justify-center shrink-0"
            style={{
              width: 22,
              height: 22,
              backgroundColor: primaryColor,
              color: textColor,
              fontSize: 9,
            }}
          >
            ↑
          </div>
        </div>
      </div>

      {/* Launcher button */}
      <div
        className="absolute flex items-center justify-center shadow-lg cursor-default select-none"
        style={{
          width: sz,
          height: sz,
          bottom: 12,
          right: isRight ? 12 : undefined,
          left: isRight ? undefined : 12,
          borderRadius: "50%",
          backgroundColor: primaryColor,
          color: textColor,
          fontSize: Math.floor(sz * 0.4),
        }}
      >
        💬
        {showBadge && (
          <span
            className="absolute top-0 right-0 rounded-full text-[7px] font-bold flex items-center justify-center"
            style={{
              width: 14,
              height: 14,
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "2px solid #fff",
            }}
          >
            1
          </span>
        )}
      </div>
    </div>
  );
}
