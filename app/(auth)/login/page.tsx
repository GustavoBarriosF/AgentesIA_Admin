"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const login        = useAuthStore((s) => s.login);

  const [serverError, setServerError]             = useState<string | null>(null);
  const [justVerified, setJustVerified]           = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendEmail, setResendEmail]             = useState("");
  const [resendSent, setResendSent]               = useState(false);
  const [resendLoading, setResendLoading]         = useState(false);
  const [showPassword, setShowPassword]           = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "true") setJustVerified(true);
  }, [searchParams]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      await api.post("/auth/resend-verification", { email: resendEmail });
      setResendSent(true);
    } catch {
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onBlur" });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setNeedsVerification(false);
    try {
      const res = await api.post("/auth/login", data);
      const { user, token, workspaces } = res.data;
      login({ user, token, workspaces });
      const slug = workspaces[0]?.workspace?.slug;
      router.push(slug ? `/${slug}/conversations` : "/");
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string } } })?.response?.data;
      const msg = errData?.error ?? "Error al iniciar sesión";
      setServerError(msg);
      if (msg.toLowerCase().includes("verificado")) {
        setNeedsVerification(true);
        setResendEmail(data.email);
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Bienvenido de vuelta
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      {/* Verified banner */}
      {justVerified && (
        <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Email verificado correctamente. Ya puedes iniciar sesión.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
              {showPassword
                ? <EyeOff className="h-4 w-4" />
                : <Eye className="h-4 w-4" />
              }
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/[8%] px-3.5 py-2.5 space-y-2">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </p>
            {needsVerification && (
              resendSent ? (
                <p className="text-xs text-green-700 dark:text-green-400 pl-6">
                  Email de verificación enviado. Revisa tu bandeja.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="pl-6 text-xs underline text-destructive hover:opacity-70 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  {resendLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Reenviar email de verificación
                </button>
              )
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full font-semibold shadow-primary-glow"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando…</>
            : "Iniciar sesión"
          }
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">¿Nuevo aquí?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Link
        href="/register"
        className="flex w-full items-center justify-center rounded-lg border border-border/80 bg-transparent px-4 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        Crear una cuenta gratis
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
