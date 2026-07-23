"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useSuperAdminInvoices } from "@/lib/hooks/superadmin/useSuperAdminInvoices";

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-500/20 text-emerald-400",
  open: "bg-amber-500/20 text-amber-400",
  draft: "bg-zinc-700 text-zinc-400",
  void: "bg-zinc-700 text-zinc-400",
  uncollectible: "bg-red-500/20 text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Pagada",
  open: "Pendiente",
  draft: "Borrador",
  void: "Anulada",
  uncollectible: "Incobrable",
};

function formatCurrency(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function BillingPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSuperAdminInvoices({
    status: statusFilter,
    date_from: dateFrom,
    date_to: dateTo,
    page,
    limit: 25,
  });

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Facturación</h1>
        <p className="text-sm text-zinc-500">
          Historial global de facturas de todos los workspaces
        </p>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Total facturado (filtro)</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">
              {formatCurrency(data.total_amount)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Facturas encontradas</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">
              {data.total.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500">Página</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">
              {data.page} / {data.pages}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-300 outline-none focus:border-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="paid">Pagada</option>
          <option value="open">Pendiente</option>
          <option value="void">Anulada</option>
          <option value="uncollectible">Incobrable</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-300 outline-none focus:border-indigo-500"
          />
          <span className="text-xs text-zinc-500">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-300 outline-none focus:border-indigo-500"
          />
        </div>
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
            <span className="text-sm">Error al cargar facturas</span>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                  <th className="px-4 py-3 text-left font-medium">Workspace</th>
                  <th className="px-4 py-3 text-left font-medium">Período</th>
                  <th className="px-4 py-3 text-left font-medium">Tier</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Pagada el</th>
                  <th className="px-4 py-3 text-right font-medium">Links</th>
                </tr>
              </thead>
              <tbody>
                {data?.invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-200">
                        {inv.workspace_name}
                      </p>
                      <p className="text-xs text-zinc-500">{inv.workspace_slug}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {new Date(inv.period_start).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      -{" "}
                      {new Date(inv.period_end).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 capitalize">
                      {inv.tier}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-200">
                      {formatCurrency(inv.amount, inv.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status] ?? "bg-zinc-700 text-zinc-300"}`}
                      >
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {inv.paid_at
                        ? new Date(inv.paid_at).toLocaleDateString("es")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.pdf_url && (
                          <a
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-500 transition hover:text-zinc-300"
                            title="PDF"
                          >
                            PDF
                          </a>
                        )}
                        {inv.invoice_url && (
                          <a
                            href={inv.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-500 transition hover:text-zinc-300"
                            title="Ver en Stripe"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.invoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-sm text-zinc-500"
                    >
                      No se encontraron facturas
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
                    onClick={() =>
                      setPage((p) => Math.min(data.pages, p + 1))
                    }
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
