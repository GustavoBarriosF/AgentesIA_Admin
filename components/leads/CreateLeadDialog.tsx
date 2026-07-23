"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContacts } from "@/lib/hooks/useContacts";
import { useCreateLead } from "@/lib/hooks/useLeads";
import { STAGE_CONFIG } from "./LeadColumn";
import type { LeadStage } from "@/types/lead";

const schema = z.object({
  contact_id: z.string().min(1, "Selecciona un contacto"),
  stage: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]),
  value: z.string().optional(),
  currency: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface CreateLeadDialogProps {
  open: boolean;
  defaultStage?: LeadStage;
  onOpenChange: (v: boolean) => void;
}

export function CreateLeadDialog({ open, defaultStage = "new", onOpenChange }: CreateLeadDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<{ _id: string; name: string } | null>(null);

  const { data: contactsData, isLoading: loadingContacts } = useContacts({ search, limit: 8 });
  const createLead = useCreateLead();

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stage: defaultStage, currency: "USD" },
  });

  const onSubmit = async (values: FormValues) => {
    await createLead.mutateAsync({
      contact_id: values.contact_id,
      stage: values.stage,
      value: values.value ? Number(values.value) : undefined,
      currency: values.currency,
    });
    reset();
    setSelectedContact(null);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Contact search */}
          <div className="space-y-1.5">
            <Label>Contacto *</Label>
            {selectedContact ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{selectedContact.name}</span>
                <button
                  type="button"
                  onClick={() => { setSelectedContact(null); setValue("contact_id", ""); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contacto..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {search && (
                  <div className="rounded-md border bg-popover shadow-sm max-h-40 overflow-y-auto">
                    {loadingContacts ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : contactsData?.contacts?.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-3 py-2">Sin resultados</p>
                    ) : (
                      contactsData?.contacts?.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setSelectedContact({ _id: c._id, name: c.name ?? "" });
                            setValue("contact_id", c._id, { shouldValidate: true });
                            setSearch("");
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                          <p className="font-medium">{c.name}</p>
                          {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <input type="hidden" {...register("contact_id")} />
            {errors.contact_id && (
              <p className="text-xs text-destructive">{errors.contact_id.message}</p>
            )}
          </div>

          {/* Stage */}
          <div className="space-y-1.5">
            <Label>Etapa</Label>
            <Select
              defaultValue={defaultStage}
              onValueChange={(v) => v && setValue("stage", v as LeadStage)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STAGE_CONFIG) as LeadStage[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STAGE_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value + Currency */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Valor estimado</Label>
              <Input type="number" placeholder="0" {...register("value")} />
            </div>
            <div className="w-24 space-y-1.5">
              <Label>Moneda</Label>
              <Input placeholder="USD" {...register("currency")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
