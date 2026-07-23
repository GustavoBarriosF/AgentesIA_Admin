"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, AlertCircle, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await api.post("/auth/forgot-password", data);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <MailCheck className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Revisa tu email
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Si ese email está registrado, recibirás en breve un enlace para
            restablecer tu contraseña.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          ¿No llegó nada? Revisa la carpeta de spam o{" "}
          <button
            type="button"
            onClick={() => setSent(false)}
            className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            inténtalo de nuevo
          </button>
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Back link */}
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
          Recupera tu contraseña
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa tu email y te enviaremos un enlace para restablecerla.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

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

        <Button
          type="submit"
          className="w-full font-semibold shadow-primary-glow"
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
            : "Enviar enlace de recuperación"
          }
        </Button>
      </form>
    </div>
  );
}
