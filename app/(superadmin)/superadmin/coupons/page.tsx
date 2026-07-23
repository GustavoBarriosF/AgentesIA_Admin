"use client";

import { useState } from "react";
import { Plus, Loader2, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import { useCoupons } from "@/lib/hooks/superadmin/useCoupons";
import { useCreateCoupon, useUpdateCoupon } from "@/lib/hooks/superadmin/useCreateCoupon";
import type { CreateCouponPayload } from "@/lib/hooks/superadmin/useCreateCoupon";
import type { Coupon } from "@/lib/hooks/superadmin/useCoupons";

const TYPE_LABEL: Record<string, string> = {
  percent: "Porcentaje",
  fixed_amount: "Monto fijo",
  free_trial_days: "Días trial",
};

function formatValue(coupon: Coupon) {
  if (coupon.type === "percent") return `${coupon.value}%`;
  if (coupon.type === "fixed_amount") return `$${(coupon.value / 100).toFixed(0)}`;
  return `${coupon.value} días`;
}

const TIER_OPTIONS = ["free", "starter", "pro", "enterprise"];

const EMPTY_FORM: CreateCouponPayload = {
  code: "",
  type: "percent",
  value: 0,
  description: "",
  applies_to: "all",
  applicable_tiers: [],
  max_uses: null,
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: null,
};

export default function CouponsPage() {
  const { data: coupons, isLoading, error } = useCoupons();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateCouponPayload>(EMPTY_FORM);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCoupon.mutateAsync(form);
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleToggle = (coupon: Coupon) => {
    updateCoupon.mutate({ id: coupon._id, active: !coupon.active });
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Cupones</h1>
          <p className="text-sm text-zinc-500">
            Gestiona descuentos y promociones
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Crear cupón
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Error al cargar cupones</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-4 py-3 text-left font-medium">Código</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Usos</th>
                <th className="px-4 py-3 text-left font-medium">Válido hasta</th>
                <th className="px-4 py-3 text-left font-medium">Aplica a</th>
                <th className="px-4 py-3 text-right font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {coupons?.map((coupon) => (
                <tr
                  key={coupon._id}
                  className="border-b border-zinc-800/50 last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono font-medium text-zinc-200">
                      {coupon.code}
                    </p>
                    {coupon.description && (
                      <p className="text-xs text-zinc-500">
                        {coupon.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {TYPE_LABEL[coupon.type]}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-200">
                    {formatValue(coupon)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {coupon.used_count}
                    {coupon.max_uses ? ` / ${coupon.max_uses}` : " / ∞"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {coupon.valid_until
                      ? new Date(coupon.valid_until).toLocaleDateString("es")
                      : "Sin vencimiento"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {coupon.applies_to === "all"
                      ? "Todos"
                      : coupon.applicable_tiers.join(", ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggle(coupon)}
                      className="transition hover:opacity-80"
                    >
                      {coupon.active ? (
                        <ToggleRight className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-zinc-600" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {coupons?.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-zinc-500"
                  >
                    No hay cupones creados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
            <div className="border-b border-zinc-800 px-6 py-4">
              <h2 className="text-base font-semibold text-zinc-100">
                Crear cupón
              </h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Código *
                  </label>
                  <input
                    required
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="PROMO20"
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 uppercase placeholder-zinc-500 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Tipo *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as CreateCouponPayload["type"],
                      }))
                    }
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500"
                  >
                    <option value="percent">Porcentaje</option>
                    <option value="fixed_amount">Monto fijo (cents)</option>
                    <option value="free_trial_days">Días trial</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Valor *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, value: Number(e.target.value) }))
                    }
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Descripción
                  </label>
                  <input
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Aplica a
                  </label>
                  <select
                    value={form.applies_to}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        applies_to: e.target.value as "all" | "specific_tiers",
                      }))
                    }
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500"
                  >
                    <option value="all">Todos los tiers</option>
                    <option value="specific_tiers">Tiers específicos</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Máx. usos (vacío = ilimitado)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_uses ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        max_uses: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>

                {form.applies_to === "specific_tiers" && (
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Tiers aplicables
                    </label>
                    <div className="flex gap-2">
                      {TIER_OPTIONS.map((t) => {
                        const selected = (form.applicable_tiers ?? []).includes(
                          t
                        );
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                applicable_tiers: selected
                                  ? (f.applicable_tiers ?? []).filter(
                                      (x) => x !== t
                                    )
                                  : [...(f.applicable_tiers ?? []), t],
                              }))
                            }
                            className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition ${
                              selected
                                ? "bg-indigo-600 text-white"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Válido desde
                  </label>
                  <input
                    type="date"
                    value={form.valid_from ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, valid_from: e.target.value }))
                    }
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">
                    Válido hasta (vacío = sin vencimiento)
                  </label>
                  <input
                    type="date"
                    value={form.valid_until ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        valid_until: e.target.value || null,
                      }))
                    }
                    className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm(EMPTY_FORM);
                  }}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createCoupon.isPending}
                  className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  {createCoupon.isPending && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Crear cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
