"use client";

import { useState } from "react";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import { cn } from "@/lib/utils";

interface PaymentLink {
  _id: string;
  description: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
}

interface Props {
  convId: string;
  disabled?: boolean;
  onSent?: () => void;
}

export function PaymentLinkModal({ convId, disabled, onSent }: Props) {
  const [open, setOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const workspaceId = useAuthStore((s) => s.activeWorkspace?.workspace._id);
  const { addToast } = useNotificationsStore();

  const { data: links, isLoading } = useQuery({
    queryKey: ["payment-links", workspaceId, "pending"],
    queryFn: async () => {
      const res = await api.get<{ data: PaymentLink[] }>(
        `/api/${workspaceId}/payment-links`,
        { params: { status: "pending", limit: 50 } }
      );
      // the endpoint may return array or { data: [...] }
      const raw = res.data;
      return Array.isArray(raw) ? (raw as unknown as PaymentLink[]) : (raw as { data: PaymentLink[] }).data ?? [];
    },
    enabled: !!workspaceId && open,
    staleTime: 30_000,
  });

  const send = useMutation({
    mutationFn: async (payment_link_id: string) => {
      const res = await api.post(
        `/api/${workspaceId}/messages/${convId}/send-payment-link`,
        { payment_link_id }
      );
      return res.data;
    },
    onSuccess: () => {
      addToast({ type: "success", message: "Link de pago enviado" });
      setOpen(false);
      onSent?.();
    },
    onError: () => {
      addToast({ type: "error", message: "No se pudo enviar el link de pago" });
    },
    onSettled: () => setSendingId(null),
  });

  const handleSend = (id: string) => {
    setSendingId(id);
    send.mutate(id);
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("es", { style: "currency", currency }).format(amount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        disabled={disabled}
        className={cn(
          "shrink-0 mb-0.5 h-7 w-7 flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        )}
        aria-label="Enviar link de pago"
      >
        <CreditCard className="h-4 w-4" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Enviar link de pago
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {isLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Cargando links…</span>
            </div>
          )}

          {!isLoading && (!links || links.length === 0) && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay links de pago pendientes en este workspace.
            </p>
          )}

          {links?.map((link) => (
            <div
              key={link._id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-3 py-2.5"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {link.description || "Sin descripción"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatAmount(link.amount, link.currency)}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary/70 hover:text-primary flex items-center gap-0.5 truncate max-w-[200px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{link.url}</span>
                </a>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {link.provider}
                </Badge>
                <Button
                  size="sm"
                  className="h-7 px-3 text-xs"
                  disabled={sendingId === link._id || send.isPending}
                  onClick={() => handleSend(link._id)}
                >
                  {sendingId === link._id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Enviar"
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
