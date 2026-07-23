"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, User, Lock, AlertCircle, CheckCircle2,
  Camera, Eye, EyeOff, Shield, Mail, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name:       z.string().min(2, "Mínimo 2 caracteres").max(80),
  avatar_url: z.string().url("URL inválida").or(z.literal("")).optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Requerida"),
    new_password:     z.string().min(8, "Mínimo 8 caracteres"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
  });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed pl-9">{description}</p>
      </div>
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-border/70 bg-card p-6 shadow-card space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Profile form ─────────────────────────────────────────────────────────────

function ProfileForm() {
  const { user, updateUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", avatar_url: user?.avatar_url ?? "" },
  });

  const onSubmit = async (data: ProfileData) => {
    try {
      const res = await api.patch("/auth/me", {
        name: data.name,
        avatar_url: data.avatar_url || null,
      });
      updateUser(res.data.user);
      reset({ name: res.data.user.name, avatar_url: res.data.user.avatar_url ?? "" });
      toast.success("Perfil actualizado correctamente");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al actualizar el perfil";
      toast.error(msg);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <Section
      icon={User}
      title="Información personal"
      description="Tu nombre y avatar se muestran en el panel y en las conversaciones con clientes."
    >
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16 ring-2 ring-border">
            <AvatarImage src={user?.avatar_url ?? ""} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted border border-border">
            <Camera className="h-2.5 w-2.5 text-muted-foreground" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">Nombre completo</Label>
          <Input
            id="name"
            placeholder="Tu nombre"
            className={errors.name ? "border-destructive" : ""}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="avatar_url" className="text-sm font-medium">URL del avatar</Label>
          <Input
            id="avatar_url"
            type="url"
            placeholder="https://ejemplo.com/mi-foto.jpg"
            className={errors.avatar_url ? "border-destructive" : ""}
            {...register("avatar_url")}
          />
          {errors.avatar_url && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.avatar_url.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Pega la URL pública de tu imagen de perfil.
          </p>
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            size="sm"
            className="font-semibold"
          >
            {isSubmitting
              ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Guardando…</>
              : "Guardar cambios"
            }
          </Button>
        </div>
      </form>
    </Section>
  );
}

// ─── Email info (read-only) ───────────────────────────────────────────────────

function EmailSection() {
  const { user } = useAuthStore();
  return (
    <Section
      icon={Mail}
      title="Dirección de email"
      description="Tu email es tu identificador único en la plataforma. Actualmente no se puede cambiar."
    >
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-foreground/80 select-all">
          {user?.email}
        </span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
          Verificado
        </span>
      </div>
    </Section>
  );
}

// ─── Password form ────────────────────────────────────────────────────────────

function PasswordForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const newPwVal  = watch("new_password", "");
  const strength  =
    newPwVal.length === 0 ? 0
    : newPwVal.length < 8  ? 1
    : /[A-Z]/.test(newPwVal) && /[0-9]/.test(newPwVal) ? 3
    : 2;
  const strengthLabel  = ["", "Débil", "Buena", "Fuerte"][strength];
  const strengthColors = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"][strength];

  const onSubmit = async (data: PasswordData) => {
    try {
      await api.post("/auth/me/password", {
        current_password: data.current_password,
        new_password:     data.new_password,
      });
      reset();
      toast.success("Contraseña actualizada correctamente");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Error al cambiar la contraseña";
      toast.error(msg);
    }
  };

  return (
    <Section
      icon={Lock}
      title="Seguridad"
      description="Cambia tu contraseña regularmente. Usa al menos 8 caracteres con mayúsculas y números."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Current password */}
        <div className="space-y-1.5">
          <Label htmlFor="current_password" className="text-sm font-medium">
            Contraseña actual
          </Label>
          <div className="relative">
            <Input
              id="current_password"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              className={errors.current_password ? "border-destructive pr-10" : "pr-10"}
              {...register("current_password")}
            />
            <button type="button" tabIndex={-1} onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.current_password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.current_password.message}
            </p>
          )}
        </div>

        <Separator />

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="new_password" className="text-sm font-medium">
            Nueva contraseña
          </Label>
          <div className="relative">
            <Input
              id="new_password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className={errors.new_password ? "border-destructive pr-10" : "pr-10"}
              {...register("new_password")}
            />
            <button type="button" tabIndex={-1} onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPwVal.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColors : "bg-muted"}`} />
                ))}
              </div>
              <p className={`text-[11px] font-medium ${
                strength === 1 ? "text-red-500" : strength === 2 ? "text-amber-500" : "text-emerald-500"
              }`}>
                Contraseña {strengthLabel}
              </p>
            </div>
          )}
          {errors.new_password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.new_password.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm_password" className="text-sm font-medium">
            Confirmar nueva contraseña
          </Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repite la nueva contraseña"
              className={errors.confirm_password ? "border-destructive pr-10" : "pr-10"}
              {...register("confirm_password")}
            />
            <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.confirm_password.message}
            </p>
          )}
        </div>

        <div className="pt-1">
          <Button type="submit" disabled={isSubmitting} size="sm" variant="outline" className="font-semibold">
            {isSubmitting
              ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Actualizando…</>
              : <><KeyRound className="mr-2 h-3.5 w-3.5" />Cambiar contraseña</>
            }
          </Button>
        </div>
      </form>
    </Section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Mi perfil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Administra tu información personal y seguridad de acceso.
          </p>
        </div>

        <Separator />

        <ProfileForm />
        <Separator />
        <EmailSection />
        <Separator />
        <PasswordForm />

      </div>
    </div>
  );
}
