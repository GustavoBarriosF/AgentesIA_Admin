"use client";

import { useState } from "react";
import {
  Package, TrendingUp, Plus, Check, X, Save,
  Loader2, Trash2, DollarSign, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/hooks/useProducts";
import { usePaymentLinks } from "@/lib/hooks/usePaymentLinks";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VentasPage() {
  const [tab, setTab] = useState<"catalogo" | "historial">("catalogo");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div>
          <h1 className="text-base font-semibold">Ventas y Cobro</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Catálogo de productos e historial de cobros realizados por el bot.
            Las pasarelas de pago se configuran en{" "}
            <span className="font-medium text-foreground">Configuración → Integraciones</span>.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b shrink-0 px-6">
        {([
          { id: "catalogo"  as const, label: "Catálogo",  icon: Package    },
          { id: "historial" as const, label: "Historial", icon: TrendingUp },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition-colors ${
              tab === id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "catalogo"  && <CatalogoTab />}
        {tab === "historial" && <HistorialTab />}
      </div>
    </div>
  );
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────

function CatalogoTab() {
  const { data, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", currency: "USD", sku: "" });
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const products = data?.data ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProduct.mutateAsync({
      name:        form.name,
      description: form.description,
      price:       parseFloat(form.price),
      currency:    form.currency.toUpperCase(),
      sku:         form.sku || undefined,
    });
    setCreating(false);
    setForm({ name: "", description: "", price: "", currency: "USD", sku: "" });
  };

  const handleUpdate = async (id: string) => {
    await updateProduct.mutateAsync({
      id,
      name:        editForm.name,
      description: editForm.description,
      price:       parseFloat(editForm.price),
      currency:    editForm.currency?.toUpperCase(),
      sku:         editForm.sku || undefined,
    });
    setEditingId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} producto(s) en el catálogo
        </p>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo producto
          </Button>
        )}
      </div>

      {/* Formulario de creación */}
      {creating && (
        <form onSubmit={handleCreate} className="rounded-lg border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-semibold">Nuevo producto</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Camiseta Premium"
                required
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Descripción</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descripción opcional..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Precio</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="29.99"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                placeholder="USD"
                maxLength={3}
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label>SKU (opcional)</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="PROD-001"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={createProduct.isPending}>
              {createProduct.isPending
                ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                : <Check className="h-4 w-4 mr-1" />}
              Crear producto
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
              <X className="h-4 w-4 mr-1" />Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Lista vacía */}
      {products.length === 0 && !creating && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Sin productos en el catálogo</p>
          <p className="text-xs text-muted-foreground mt-1">
            Agrega productos para que el bot pueda venderlos y generar links de pago.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Agregar primer producto
          </Button>
        </div>
      )}

      {/* Tabla de productos */}
      {products.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Producto</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Precio</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">SKU</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Estado</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p._id} className={!p.active ? "opacity-50" : ""}>
                  {editingId === p._id ? (
                    <td colSpan={5} className="px-4 py-3">
                      <div className="grid grid-cols-4 gap-2 items-end">
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs">Nombre</Label>
                          <Input
                            value={editForm.name ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Precio</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.price ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Moneda</Label>
                          <Input
                            value={editForm.currency ?? ""}
                            onChange={(e) => setEditForm((f) => ({ ...f, currency: e.target.value }))}
                            maxLength={3}
                            className="uppercase"
                          />
                        </div>
                        <div className="col-span-4 flex gap-2 pt-1">
                          <Button size="sm" onClick={() => handleUpdate(p._id)} disabled={updateProduct.isPending}>
                            {updateProduct.isPending
                              ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              : <Save className="h-4 w-4 mr-1" />}
                            Guardar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.name}</p>
                        {p.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {p.currency} {p.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.sku ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.active ? "default" : "secondary"} className="text-xs">
                          {p.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(p._id);
                              setEditForm({
                                name:        p.name,
                                price:       String(p.price),
                                currency:    p.currency,
                                description: p.description,
                                sku:         p.sku ?? "",
                              });
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteProduct.mutate(p._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Historial ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300",
  paid:      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  expired:   "bg-muted text-muted-foreground border-border",
  failed:    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<string, string> = {
  pending:   "Pendiente",
  paid:      "Pagado",
  expired:   "Expirado",
  failed:    "Fallido",
  cancelled: "Cancelado",
};

function HistorialTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data, isLoading } = usePaymentLinks({
    limit: 100,
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {}),
  });

  const links = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground mr-2">Filtrar:</p>
        {(["all", "pending", "paid", "failed", "expired"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "Todos" : STATUS_LABEL[s]}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{data?.total ?? 0} total</span>
      </div>

      {/* Lista vacía */}
      {links.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Sin links de pago</p>
          <p className="text-xs text-muted-foreground mt-1">
            Los links generados por el bot aparecerán aquí con su estado de pago.
          </p>
        </div>
      )}

      {/* Tabla */}
      {links.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Descripción</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Pasarela</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Monto</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Estado</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Fecha</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {links.map((link) => (
                <tr key={link._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{link.description || "Pago"}</p>
                    <p className="text-xs text-muted-foreground">
                      {link.items.length} item(s)
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{link.provider}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">
                    {link.currency} {link.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[link.status]}`}>
                      {STATUS_LABEL[link.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {link.paid_at
                      ? new Date(link.paid_at).toLocaleDateString()
                      : new Date(link.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      title="Copiar URL de pago"
                      onClick={() => {
                        navigator.clipboard.writeText(link.url);
                        toast.success("URL copiada");
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
