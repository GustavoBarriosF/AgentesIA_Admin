"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, Edit2, RefreshCw, Check, X, PackagePlus } from "lucide-react";
import { usePlanDefinitions } from "@/lib/hooks/superadmin/usePlanDefinitions";
import { useUpdatePlanDefinition, useSyncPlansToStripe, useSeedDefaultPlans } from "@/lib/hooks/superadmin/useUpdatePlanDefinition";
import type { PlanDefinition } from "@/lib/hooks/superadmin/usePlanDefinitions";

const TIER_COLORS: Record<string, string> = {
  free: "border-zinc-700",
  starter: "border-blue-500/50",
  pro: "border-indigo-500/50",
  enterprise: "border-purple-500/50",
};

const TIER_HEADER: Record<string, string> = {
  free: "bg-zinc-800",
  starter: "bg-blue-500/10",
  pro: "bg-indigo-500/10",
  enterprise: "bg-purple-500/10",
};

const TIER_BADGE: Record<string, string> = {
  free: "text-zinc-400",
  starter: "text-blue-400",
  pro: "text-indigo-400",
  enterprise: "text-purple-400",
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

const FEATURE_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  api: "API",
  bot: "Bot IA",
  analytics: "Analytics",
  sla: "SLA",
};

export default function PlansPage() {
  const { data: plans, isLoading, error } = usePlanDefinitions();
  const updatePlan = useUpdatePlanDefinition();
  const syncStripe = useSyncPlansToStripe();
  const seedPlans  = useSeedDefaultPlans();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlanDefinition>>({});

  const handleEdit = (plan: PlanDefinition) => {
    setEditingId(plan._id);
    setEditForm({ ...plan });
  };

  const handleSave = async () => {
    if (!editingId) return;
    await updatePlan.mutateAsync({ id: editingId, ...editForm });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !plans) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-red-400">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm">Error al cargar planes</span>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-500/10">
          <PackagePlus className="h-7 w-7 text-indigo-400" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-zinc-100">No hay planes configurados</p>
          <p className="mt-1 text-sm text-zinc-500">
            Crea los 4 planes base (Free, Starter, Pro, Enterprise) para comenzar.
          </p>
        </div>
        <button
          onClick={() => seedPlans.mutate()}
          disabled={seedPlans.isPending}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
        >
          {seedPlans.isPending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <PackagePlus className="h-4 w-4" />
          }
          Crear planes por defecto
        </button>
      </div>
    );
  }

  const sortedPlans = [...plans].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Planes</h1>
          <p className="text-sm text-zinc-500">
            Configura precios, límites y features de cada tier
          </p>
        </div>
        <button
          onClick={() => syncStripe.mutate()}
          disabled={syncStripe.isPending}
          className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-60"
        >
          {syncStripe.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sincronizar con Stripe
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {sortedPlans.map((plan) => {
          const isEditing = editingId === plan._id;
          const form = isEditing ? editForm : plan;

          return (
            <div
              key={plan._id}
              className={`overflow-hidden rounded-xl border bg-zinc-900 ${TIER_COLORS[plan.tier] ?? "border-zinc-700"}`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between px-5 py-4 ${TIER_HEADER[plan.tier]}`}
              >
                <div>
                  <p
                    className={`text-sm font-semibold uppercase tracking-wide ${TIER_BADGE[plan.tier]}`}
                  >
                    {plan.tier}
                  </p>
                  <p className="text-lg font-bold text-zinc-100">{plan.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Active toggle */}
                  <button
                    onClick={() =>
                      updatePlan.mutate({ id: plan._id, active: !plan.active })
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      plan.active
                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                        : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                    }`}
                  >
                    {plan.active ? "Activo" : "Inactivo"}
                  </button>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <button
                        onClick={handleSave}
                        disabled={updatePlan.isPending}
                        className="rounded p-1.5 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(plan)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-5">
                {/* Prices */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-xs text-zinc-500">Precio mensual (USD cents)</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.price_monthly ?? 0}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            price_monthly: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <p className="text-sm font-medium text-zinc-200">
                        {formatPrice(plan.price_monthly)}/mes
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-zinc-500">Precio anual (USD cents)</p>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.price_yearly ?? 0}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            price_yearly: Number(e.target.value),
                          }))
                        }
                        className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <p className="text-sm font-medium text-zinc-200">
                        {formatPrice(plan.price_yearly)}/año
                      </p>
                    )}
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Límites
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {([
                      ["conversations_per_month", "Conversaciones/mes"],
                      ["agents", "Agentes"],
                      ["channels", "Canales"],
                      ["storage_gb", "Storage (GB)"],
                      ["knowledge_items", "Knowledge items"],
                      ["bots", "Bots"],
                    ] as [keyof PlanDefinition["limits"], string][]).map(
                      ([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-zinc-500">{label}</span>
                          {isEditing ? (
                            <input
                              type="number"
                              value={
                                (editForm.limits?.[key] as number) ??
                                plan.limits[key]
                              }
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  limits: {
                                    ...(f.limits ?? plan.limits),
                                    [key]: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-20 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-right text-zinc-100 outline-none focus:border-indigo-500"
                            />
                          ) : (
                            <span className="font-medium text-zinc-300">
                              {plan.limits[key] === -1
                                ? "Ilimitado"
                                : plan.limits[key].toLocaleString()}
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Features
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(FEATURE_LABELS).map(([feat, label]) => {
                      const included = (form.features ?? []).includes(feat);
                      if (isEditing) {
                        return (
                          <button
                            key={feat}
                            onClick={() =>
                              setEditForm((f) => ({
                                ...f,
                                features: included
                                  ? (f.features ?? plan.features).filter(
                                      (x) => x !== feat
                                    )
                                  : [...(f.features ?? plan.features), feat],
                              }))
                            }
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                              included
                                ? "bg-indigo-500/20 text-indigo-400"
                                : "bg-zinc-800 text-zinc-600"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      }
                      return included ? (
                        <span
                          key={feat}
                          className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-400"
                        >
                          {label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Trial days */}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs">
                  <span className="text-zinc-500">Días de trial</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editForm.trial_days ?? plan.trial_days}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          trial_days: Number(e.target.value),
                        }))
                      }
                      className="w-16 rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-right text-zinc-100 outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span className="font-medium text-zinc-300">
                      {plan.trial_days} días
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
