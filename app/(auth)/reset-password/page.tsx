"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, XCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm:  z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token");

  const [status, setStatus]     = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showCfm, setShowCfm]   = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("El enlace no es válido o ha expirado.");
    }
  }, [token]);

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/auth/reset-password", { token, password: data.password });
      setStatus("success");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "El enlace ha expirado o no es válido.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-800">
          <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            ¡Contraseña actualizada!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu contraseña fue restablecida correctamente.
            Serás redirigido al login en unos segundos...
          </p>
        </div>
        <Link href="/login">
          <Button className="w-full font-semibold" size="lg">
            Ir al inicio de sesión
          </Button>
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <XCircle className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Enlace inválido
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
        </div>
        <Link href="/forgot-password">
          <Button variant="outline" className="w-full" size="lg">
            Solicitar nuevo enlace
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Back */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver
      </Link>

      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Nueva contraseña
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige una contraseña segura para tu cuenta
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">
            Nueva contraseña
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className={errors.password ? "border-destructive focus-visible:ring-destructive/30 pr-10" : "pr-10"}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPw ? "Ocultar" : "Mostrar"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-sm font-medium">
            Confirmar contraseña
          </Label>
          <div className="relative">
            <Input
              id="confirm"
              type={showCfm ? "text" : "password"}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              className={errors.confirm ? "border-destructive focus-visible:ring-destructive/30 pr-10" : "pr-10"}
              {...register("confirm")}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowCfm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCfm ? "Ocultar" : "Mostrar"}
            >
              {showCfm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirm && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.confirm.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full font-semibold shadow-primary-glow"
          disabled={isSubmitting || !token}
          size="lg"
        >
          {isSubmitting
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando…</>
            : "Restablecer contraseña"
          }
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
