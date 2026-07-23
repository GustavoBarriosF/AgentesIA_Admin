"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Building2,
  CreditCard,
  Settings,
  Trash2,
  Ban,
  CheckCircle,
  Gift,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useSuperAdminWorkspace } from "@/lib/hooks/superadmin/useSuperAdminWorkspace";
import { useChangePlan } from "@/lib/hooks/superadmin/useChangePlan";
import {
  useSuspendWorkspace,
  useActivateWorkspace,
} from "@/lib/hooks/superadmin/useToggleSuspend";
import { useGrantTrial } from "@/lib/hooks/superadmin/useGrantTrial";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import apiSuperAdmin from "@/lib/api-superadmin";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "plan" | "billing" | "actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_BADGE: Record<string, string> = {
  free: "bg-zinc-700 text-zinc-300",
  starter: "bg-blue-500/20 text-blue-400",
  pro: "bg-indigo-500/20 text-indigo-400",
  enterprise: "bg-purple-500/20 text-purple-400",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  trialing: "bg-amber-500/20 text-amber-400",
  suspended: "bg-red-500/20 text-red-400",
  canceled: "bg-zinc-700 text-zinc-400",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  trialing: "Trial",
  suspended: "Suspendido",
  canceled: "Cancelado",
};

const INVOICE_STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-400",
  open: "bg-amber-500/20 text-amber-400",
  draft: "bg-zinc-700 text-zinc-400",
  void: "bg-zinc-700 text-zinc-400",
  uncollectible: "bg-red-500/20 text-red-400",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function ProgressBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number | undefined | null;
  limit: number | undefined | null;
}) {
  const safeUsed  = used  ?? 0;
  const safeLimit = limit ?? 0;
  const unlimited = safeLimit === -1;
  const pct = unlimited || safeLimit === 0 ? 0 : Math.min(100, Math.round((safeUsed / safeLimit) * 100));
  const danger = pct >= 90;
  const warn = pct >= 70 && pct < 90;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className={danger ? "text-red-400" : warn ? "text-amber-400" : "text-zinc-400"}>
          {safeUsed.toLocaleString()} / {unlimited ? "∞" : safeLimit.toLocaleString()}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${
              danger ? "bg-red-500" : warn ? "bg-amber-500" : "bg-indigo-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function ChangePlanModal({
  workspaceId,
  currentTier,
  onClose,
}: {
  workspaceId: string;
  currentTier: string;
  onClose: () => void;
}) {
  const changePlan = useChangePlan();
  const [tier, setTier] = useState(currentTier);
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await changePlan.mutateAsync({ workspaceId, tier, note, coupon: coupon || undefined });
    onClose();
  };

  return (
    <Modal title="Cambiar plan" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Nuevo tier
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          >
            {["free", "starter", "pro", "enterprise"].map((t) => (
              <option key={t} value={t} className="capitalize">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Cupón (opcional)
          </label>
          <input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="PROMO20"
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm uppercase text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Nota interna (opcional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Razón del cambio manual..."
            className="w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
          />
        </div>
        <ModalFooter onClose={onClose} isPending={changePlan.isPending} label="Cambiar plan" />
      </form>
    </Modal>
  );
}

function GrantTrialModal({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const grantTrial = useGrantTrial();
  const [days, setDays] = useState(14);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await grantTrial.mutateAsync({ workspaceId, days });
    onClose();
  };

  return (
    <Modal title="Otorgar días de trial" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Días de trial
          </label>
          <input
            type="number"
            required
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            El workspace tendrá acceso Pro por {days} días sin cargo.
          </p>
        </div>
        <ModalFooter onClose={onClose} isPending={grantTrial.isPending} label="Otorgar trial" />
      </form>
    </Modal>
  );
}

function SuspendModal({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const suspendWs = useSuspendWorkspace();
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await suspendWs.mutateAsync({ workspaceId, reason });
    onClose();
  };

  return (
    <Modal title="Suspender workspace" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          El workspace quedará inaccesible para sus usuarios inmediatamente.
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Razón de la suspensión *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe el motivo de la suspensión..."
            className="w-full resize-none rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
          />
        </div>
        <ModalFooter
          onClose={onClose}
          isPending={suspendWs.isPending}
          label="Suspender"
          danger
        />
      </form>
    </Modal>
  );
}

function DeleteWorkspaceModal({
  workspaceId,
  slug,
  onClose,
}: {
  workspaceId: string;
  slug: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState("");

  const deleteWs = useMutation({
    mutationFn: async () => {
      await apiSuperAdmin.delete(`/superadmin/workspaces/${workspaceId}`);
    },
    onSuccess: () => {
      toast.success("Workspace eliminado");
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces"] });
      router.push("/superadmin/workspaces");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al eliminar";
      toast.error(msg);
    },
  });

  const canDelete = confirm === slug;

  return (
    <Modal title="Eliminar workspace" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          Esta acción es irreversible. Se eliminarán todas las conversaciones,
          contactos, agentes, canales y datos del workspace.
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-400">
            Escribe{" "}
            <span className="font-mono text-zinc-200">{slug}</span> para
            confirmar
          </label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-red-500"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            disabled={!canDelete || deleteWs.isPending}
            onClick={() => deleteWs.mutate()}
            className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-40"
          >
            {deleteWs.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Eliminar permanentemente
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Shared modal shell
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalFooter({
  onClose,
  isPending,
  label,
  danger = false,
}: {
  onClose: () => void;
  isPending: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
      <button
        type="button"
        onClick={onClose}
        className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={isPending}
        className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60 ${
          danger
            ? "bg-red-600 hover:bg-red-500"
            : "bg-indigo-600 hover:bg-indigo-500"
        }`}
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {label}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [modal, setModal] = useState<
    "changePlan" | "trial" | "suspend" | "delete" | null
  >(null);

  const { data: ws, isLoading, error } = useSuperAdminWorkspace(workspaceId);
  const activateWs = useActivateWorkspace();

  const resetUsage = useMutation({
    mutationFn: async () => {
      await apiSuperAdmin.post(
        `/superadmin/workspaces/${workspaceId}/reset-usage`
      );
    },
    onSuccess: () => {
      toast.success("Uso reiniciado");
      qc.invalidateQueries({ queryKey: ["superadmin", "workspaces", workspaceId] });
    },
    onError: () => toast.error("Error al reiniciar uso"),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !ws) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-red-400">
        <AlertTriangle className="h-5 w-5" />
        <span className="text-sm">No se encontró el workspace</span>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Building2 className="h-4 w-4" /> },
    { id: "plan", label: "Plan & Uso", icon: <ChevronRight className="h-4 w-4" /> },
    { id: "billing", label: "Facturación", icon: <CreditCard className="h-4 w-4" /> },
    { id: "actions", label: "Acciones", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <button
          onClick={() => router.back()}
          className="mb-3 flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100">{ws.name}</h1>
            <p className="text-sm text-zinc-500">{ws.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${TIER_BADGE[ws.plan.tier] ?? "bg-zinc-700 text-zinc-300"}`}
            >
              {ws.plan.tier}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[ws.plan.status] ?? "bg-zinc-700 text-zinc-300"}`}
            >
              {STATUS_LABEL[ws.plan.status] ?? ws.plan.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm transition ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {/* Workspace info */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="mb-4 text-sm font-medium text-zinc-300">
                Información del workspace
              </p>
              <dl className="space-y-3 text-sm">
                <InfoRow label="Nombre" value={ws.name} />
                <InfoRow label="Slug" value={ws.slug} mono />
                <InfoRow
                  label="Creado"
                  value={new Date(ws.created_at).toLocaleDateString("es", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </dl>
            </div>

            {/* Owner */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="mb-4 text-sm font-medium text-zinc-300">Owner</p>
              <dl className="space-y-3 text-sm">
                <InfoRow label="Nombre" value={ws.owner.name} />
                <InfoRow label="Email" value={ws.owner.email} />
              </dl>
            </div>

            {/* Members */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="mb-4 text-sm font-medium text-zinc-300">
                Miembros ({ws.members.length})
              </p>
              <div className="space-y-2">
                {ws.members.map((m) => (
                  <div
                    key={m.email}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="text-zinc-200">{m.name}</p>
                      <p className="text-xs text-zinc-500">{m.email}</p>
                    </div>
                    <span className="text-xs capitalize text-zinc-500">
                      {m.role}
                    </span>
                  </div>
                ))}
                {ws.members.length === 0 && (
                  <p className="text-sm text-zinc-500">Sin miembros adicionales</p>
                )}
              </div>
            </div>

            {/* Channels */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="mb-4 text-sm font-medium text-zinc-300">
                Canales ({ws.channels.length})
              </p>
              <div className="space-y-2">
                {ws.channels.map((ch, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-zinc-300">{ch.type}</span>
                    <span
                      className={`text-xs ${ch.active ? "text-emerald-400" : "text-zinc-500"}`}
                    >
                      {ch.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                ))}
                {ws.channels.length === 0 && (
                  <p className="text-sm text-zinc-500">Sin canales configurados</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PLAN & USO ── */}
        {activeTab === "plan" && (
          <div className="space-y-5">
            {/* Plan info */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="mb-4 text-sm font-medium text-zinc-300">Plan actual</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <InfoRow label="Tier" value={ws.plan.tier} capitalize />
                <InfoRow
                  label="Estado"
                  value={STATUS_LABEL[ws.plan.status] ?? ws.plan.status}
                />
                <InfoRow
                  label="Ciclo de facturación"
                  value={ws.plan.billing_cycle ?? "—"}
                />
                <InfoRow
                  label="Próxima factura"
                  value={
                    ws.plan.next_billing_date
                      ? new Date(ws.plan.next_billing_date).toLocaleDateString(
                          "es"
                        )
                      : "—"
                  }
                />
                {ws.plan.trial_started_at && (
                  <InfoRow
                    label="Trial iniciado"
                    value={new Date(ws.plan.trial_started_at).toLocaleDateString(
                      "es"
                    )}
                  />
                )}
                {ws.plan.coupon_applied && (
                  <InfoRow
                    label="Cupón aplicado"
                    value={ws.plan.coupon_applied}
                    mono
                  />
                )}
                {ws.plan.override_by && (
                  <>
                    <InfoRow label="Override por" value={ws.plan.override_by} />
                    <InfoRow
                      label="Nota override"
                      value={ws.plan.override_note ?? ""}
                    />
                  </>
                )}
                {ws.plan.suspended_at && (
                  <>
                    <InfoRow
                      label="Suspendido el"
                      value={new Date(ws.plan.suspended_at).toLocaleDateString(
                        "es"
                      )}
                    />
                    <InfoRow
                      label="Razón"
                      value={ws.plan.suspension_reason ?? ""}
                    />
                  </>
                )}
              </dl>
            </div>

            {/* Usage vs limits */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="mb-4 text-sm font-medium text-zinc-300">
                Uso vs límites
              </p>
              <div className="space-y-4">
                <ProgressBar
                  label="Conversaciones este mes"
                  used={ws.plan.usage.conversations_this_month}
                  limit={ws.plan.limits.conversations_per_month}
                />
                <ProgressBar
                  label="Agentes"
                  used={ws.plan.usage.agents}
                  limit={ws.plan.limits.agents}
                />
                <ProgressBar
                  label="Canales"
                  used={ws.plan.usage.channels}
                  limit={ws.plan.limits.channels}
                />
                <ProgressBar
                  label="Knowledge items"
                  used={ws.plan.usage.knowledge_items}
                  limit={ws.plan.limits.knowledge_items}
                />
                <ProgressBar
                  label="Bots"
                  used={ws.plan.usage.bots}
                  limit={ws.plan.limits.bots}
                />
                <ProgressBar
                  label="Storage (GB)"
                  used={ws.plan.usage.storage_gb}
                  limit={ws.plan.limits.storage_gb}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── BILLING ── */}
        {activeTab === "billing" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-5 py-4">
              <p className="text-sm font-medium text-zinc-300">
                Facturas recientes
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-5 py-3 text-left font-medium">Período</th>
                  <th className="px-5 py-3 text-left font-medium">Tier</th>
                  <th className="px-5 py-3 text-right font-medium">Monto</th>
                  <th className="px-5 py-3 text-left font-medium">Estado</th>
                  <th className="px-5 py-3 text-left font-medium">Pagada el</th>
                </tr>
              </thead>
              <tbody>
                {ws.recent_invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="px-5 py-3 text-xs text-zinc-400">
                      {new Date(inv.period_start).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      —{" "}
                      {new Date(inv.period_end).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 capitalize text-zinc-400">
                      {inv.tier}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-zinc-200">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_BADGE[inv.status] ?? "bg-zinc-700 text-zinc-300"}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-zinc-400">
                      {inv.paid_at
                        ? new Date(inv.paid_at).toLocaleDateString("es")
                        : "—"}
                    </td>
                  </tr>
                ))}
                {ws.recent_invoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-sm text-zinc-500"
                    >
                      Sin facturas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ACTIONS ── */}
        {activeTab === "actions" && (
          <div className="space-y-3">
            <ActionCard
              icon={<ChevronRight className="h-4 w-4 text-indigo-400" />}
              title="Cambiar plan"
              description="Asigna un tier diferente de forma manual sin pasar por Stripe."
              onClick={() => setModal("changePlan")}
            />
            <ActionCard
              icon={<Gift className="h-4 w-4 text-amber-400" />}
              title="Otorgar días de trial"
              description="Da acceso gratuito por N días como cortesía o compensación."
              onClick={() => setModal("trial")}
            />
            <ActionCard
              icon={<RefreshCw className="h-4 w-4 text-blue-400" />}
              title="Reiniciar uso del mes"
              description="Resetea el contador de conversaciones del mes actual."
              onClick={() => resetUsage.mutate()}
              isPending={resetUsage.isPending}
            />
            {ws.plan.status === "suspended" ? (
              <ActionCard
                icon={<CheckCircle className="h-4 w-4 text-emerald-400" />}
                title="Reactivar workspace"
                description="Restaura el acceso al workspace suspendido."
                onClick={() =>
                  activateWs.mutate({ workspaceId })
                }
                isPending={activateWs.isPending}
              />
            ) : (
              <ActionCard
                icon={<Ban className="h-4 w-4 text-red-400" />}
                title="Suspender workspace"
                description="Bloquea el acceso inmediatamente. Se puede reactivar después."
                onClick={() => setModal("suspend")}
                danger
              />
            )}
            <ActionCard
              icon={<Trash2 className="h-4 w-4 text-red-500" />}
              title="Eliminar workspace"
              description="Elimina permanentemente el workspace y todos sus datos. Irreversible."
              onClick={() => setModal("delete")}
              danger
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "changePlan" && ws && (
        <ChangePlanModal
          workspaceId={workspaceId}
          currentTier={ws.plan.tier}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "trial" && (
        <GrantTrialModal
          workspaceId={workspaceId}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "suspend" && (
        <SuspendModal
          workspaceId={workspaceId}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "delete" && (
        <DeleteWorkspaceModal
          workspaceId={workspaceId}
          slug={ws.slug}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono = false,
  capitalize = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex-shrink-0 text-zinc-500">{label}</dt>
      <dd
        className={`text-right text-zinc-300 ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  isPending = false,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isPending?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition disabled:opacity-60 ${
        danger
          ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
          : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
      }`}
    >
      <div
        className={`flex-shrink-0 rounded-lg p-2 ${danger ? "bg-red-500/10" : "bg-zinc-800"}`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : (
          icon
        )}
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-medium ${danger ? "text-red-400" : "text-zinc-200"}`}
        >
          {title}
        </p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <ChevronRight className="ml-auto h-4 w-4 flex-shrink-0 text-zinc-600" />
    </button>
  );
}
