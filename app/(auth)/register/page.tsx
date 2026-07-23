"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";

const schema = z.object({
  name:     z.string().min(2, "Mínimo 2 caracteres"),
  email:    z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const login  = useAuthStore((s) => s.login);

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onBlur" });

  const passwordValue = watch("password", "");
  const strength =
    passwordValue.length === 0 ? 0
    : passwordValue.length < 8  ? 1
    : /[A-Z]/.test(passwordValue) && /[0-9]/.test(passwordValue) ? 3
    : 2;

  const strengthLabel  = ["", "Débil", "Buena", "Fuerte"][strength];
  const strengthColors = ["", "bg-red-400", "bg-amber-400", "bg-emerald-400"][strength];

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      const { user, token, workspaces } = res.data;
      login({ user, token, workspaces });
      const slug = workspaces[0]?.workspace?.slug;
      router.push(slug ? `/${slug}/conversations` : "/");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? "Error al registrarse";
      setServerError(msg);
    }
  };

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Crea tu cuenta
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Empieza gratis, sin tarjeta de crédito
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Nombre completo
          </Label>
          <Input
            id="name"
            placeholder="Juan García"
            autoComplete="name"
            className={errors.name ? "border-destructive focus-visible:ring-destructive/30" : ""}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@empresa.com"
            autoComplete="email"
            className={errors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className={errors.password ? "border-destructive focus-visible:ring-destructive/30 pr-10" : "pr-10"}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password strength meter */}
          {passwordValue.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i <= strength ? strengthColors : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className={`text-[11px] font-medium ${
                strength === 1 ? "text-red-500" :
                strength === 2 ? "text-amber-500" :
                "text-emerald-500"
              }`}>
                Contraseña {strengthLabel}
              </p>
            </div>
          )}

          {errors.password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/[8%] px-3.5 py-2.5">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full font-semibold shadow-primary-glow"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta…</>
            : "Crear cuenta gratis"
          }
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Al registrarte aceptas los{" "}
          <span className="text-foreground/70 underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">
            Términos de servicio
          </span>{" "}
          y la{" "}
          <span className="text-foreground/70 underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">
            Política de privacidad
          </span>
        </p>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">¿Ya tienes cuenta?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Link
        href="/login"
        className="flex w-full items-center justify-center rounded-lg border border-border/80 bg-transparent px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}
