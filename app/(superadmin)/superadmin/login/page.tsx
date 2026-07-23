"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, Wrench } from "lucide-react";
import apiSuperAdmin from "@/lib/api-superadmin";
import { useSuperAdminStore } from "@/lib/stores/superadmin.store";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const setupSchema = z.object({
  name:            z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email:           z.string().email("Email inválido"),
  password:        z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type SetupData = z.infer<typeof setupSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const storeLogin = useSuperAdminStore((s) => s.login);

  const [mode, setMode] = useState<"loading" | "login" | "setup">("loading");
  const [serverError, setServerError] = useState<string | null>(null);

  // Detectar si el sistema necesita configuración inicial
  useEffect(() => {
    apiSuperAdmin
      .get("/superadmin/auth/setup-status")
      .then((res) => {
        setMode(res.data.needs_setup ? "setup" : "login");
      })
      .catch(() => {
        setMode("login"); // si falla la verificación, mostrar login normal
      });
  }, []);

  // ─── Form: Login ────────────────────────────────────────────────────────────

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onLogin = async (data: LoginData) => {
    setServerError(null);
    try {
      const res = await apiSuperAdmin.post("/superadmin/auth/login", data);
      const { superAdmin, token } = res.data;
      storeLogin({ admin: superAdmin, token });
      router.push("/superadmin/dashboard");
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data;
      setServerError(errData?.error ?? errData?.message ?? "Credenciales incorrectas");
    }
  };

  // ─── Form: Setup ────────────────────────────────────────────────────────────

  const setupForm = useForm<SetupData>({
    resolver: zodResolver(setupSchema),
    mode: "onBlur",
  });

  const onSetup = async (data: SetupData) => {
    setServerError(null);
    try {
      const res = await apiSuperAdmin.post("/superadmin/auth/setup", {
        name:     data.name,
        email:    data.email,
        password: data.password,
      });
      const { superAdmin, token } = res.data;
      storeLogin({ admin: superAdmin, token });
      router.push("/superadmin/dashboard");
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data;
      setServerError(errData?.error ?? errData?.message ?? "Error al crear la cuenta");
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
            mode === "setup" ? "bg-amber-600" : "bg-indigo-600"
          }`}>
            {mode === "setup"
              ? <Wrench className="h-6 w-6 text-white" />
              : <ShieldCheck className="h-6 w-6 text-white" />
            }
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">
            {mode === "setup" ? "Configuración inicial" : "NexoraChat Super Admin"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {mode === "setup"
              ? "Crea la cuenta de administrador para comenzar"
              : "Acceso restringido al personal autorizado"
            }
          </p>
        </div>

        {/* Setup notice */}
        {mode === "setup" && (
          <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-400">
              No existe ningún administrador registrado. Completa el formulario para configurar el sistema.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">

          {/* ── LOGIN ─────────────────────────────────────────────────────── */}
          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@NexoraChat.com"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-400">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-400">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              {serverError && (
                <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {loginForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Iniciar sesión
              </button>
            </form>
          )}

          {/* ── SETUP ─────────────────────────────────────────────────────── */}
          {mode === "setup" && (
            <form onSubmit={setupForm.handleSubmit(onSetup)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                  Nombre completo
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Tu nombre"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  {...setupForm.register("name")}
                />
                {setupForm.formState.errors.name && (
                  <p className="text-xs text-red-400">{setupForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="setup-email" className="block text-sm font-medium text-zinc-300">
                  Email
                </label>
                <input
                  id="setup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@tudominio.com"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  {...setupForm.register("email")}
                />
                {setupForm.formState.errors.email && (
                  <p className="text-xs text-red-400">{setupForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="setup-password" className="block text-sm font-medium text-zinc-300">
                  Contraseña <span className="text-zinc-500">(mín. 8 caracteres)</span>
                </label>
                <input
                  id="setup-password"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  {...setupForm.register("password")}
                />
                {setupForm.formState.errors.password && (
                  <p className="text-xs text-red-400">{setupForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-300">
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  {...setupForm.register("confirmPassword")}
                />
                {setupForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-400">{setupForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {serverError && (
                <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={setupForm.formState.isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-60"
              >
                {setupForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta y entrar
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
