"use client";

import { useRef } from "react";
import { Bot, Camera } from "lucide-react";

interface BotAvatarUploadProps {
  value?: string | null;
  name?: string;
  onChange: (base64: string | null) => void;
  compact?: boolean;
}

export function BotAvatarUpload({ value, name, onChange, compact = false }: BotAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const avatarSize = compact ? "h-9 w-9" : "h-16 w-16";
  const iconSize   = compact ? "h-5 w-5" : "h-7 w-7";
  const camSize    = compact ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className={compact ? undefined : "flex items-center gap-4"}>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative ${avatarSize} rounded-full overflow-hidden border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors group bg-muted flex items-center justify-center shrink-0`}
      >
        {value ? (
          <img src={value} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <Bot className={`${iconSize} text-muted-foreground`} />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className={`${camSize} text-white`} />
        </div>
      </div>
      {!compact && (
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{name || "Sin nombre"}</p>
          <p className="text-xs">Clic para subir imagen (JPG, PNG · max 2MB)</p>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs text-destructive hover:underline mt-0.5"
            >
              Eliminar imagen
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
