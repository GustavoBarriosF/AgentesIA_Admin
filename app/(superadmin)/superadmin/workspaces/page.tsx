"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useSuperAdminWorkspaces } from "@/lib/hooks/superadmin/useSuperAdminWorkspaces";
import type { WorkspaceListItem } from "@/lib/hooks/superadmin/useSuperAdminWorkspaces";

const TIER_OPTIONS = [
  { label: "Todos los tiers", value: "" },
  { label: "Free", value: "free" },
  { label: "Starter", value: "starter" },
  { label: "Pro", value: "pro" },
  { label: "Enterprise", value: "enterprise" },
];

const STATUS_OPTIONS = [
  { label: "Todos los estados", value: "" },
  { label: "Activo", value: "active" },
  { label: "Trial", value: "trialing" },
  { label: "Suspendido", value: "suspended" },
  { label: "Cancelado", value: "canceled" },
];

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

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default function WorkspacesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [tier, setTier] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSuperAdminWorkspaces({
    search,
    tier,
    status,
    page,
    limit: 20,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilterChange = (field: "tier" | "status", value: string) => {
    if (field === "tier") setTier(value);
    else setStatus(value);
    setPage(1);
  };

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Workspaces</h1>
        <p className="text-sm text-zinc-500">
          {data ? `${data.total.toLocaleString()} workspaces en total` : "Cargando..."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-64 rounded-md border border-zinc-700 bg-zinc-800 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-indigo-500"
          />
        </form>

        <select
          value={tier}
          onChange={(e) => handleFilterChange("tier", e.target.value)}
          className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-300 outline-none focus:border-indigo-500"
        >
          {TIER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-300 outline-none focus:border-indigo-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
            <span className="text-sm">Error al cargar workspaces</span>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-4 py-3 text-left font-medium">Workspace</th>
                  <th className="px-4 py-3 text-left font-medium">Owner</th>
                  <th className="px-4 py-3 text-left font-medium">Tier</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">MRR</th>
                  <th className="px-4 py-3 text-right font-medium">Conv. mes</th>
                  <th className="px-4 py-3 text-right font-medium">Registro</th>
                </tr>
              </thead>
              <tbody>
                {data?.workspaces.map((ws: WorkspaceListItem) => (
                  <tr
                    key={ws._id}
                    onClick={() =>
                      router.push(`/superadmin/workspaces/${ws._id}`)
                    }
                    className="cursor-pointer border-b border-zinc-800/50 transition-colors last:border-0 hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-200">{ws.name}</p>
                      <p className="text-xs text-zinc-500">{ws.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{ws.owner_email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TIER_BADGE[ws.tier] ?? "bg-zinc-700 text-zinc-300"}`}
                      >
                        {ws.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[ws.status] ?? "bg-zinc-700 text-zinc-300"}`}
                      >
                        {STATUS_LABEL[ws.status] ?? ws.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatCurrency(ws.mrr)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {ws.conversations_this_month.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">
                      {new Date(ws.created_at).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {data?.workspaces.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-zinc-500"
                    >
                      No se encontraron workspaces
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
                <p className="text-xs text-zinc-500">
                  Página {data.page} de {data.pages}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
