"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Loader2, Tag, Clock, ChevronDown,
  Lock, Globe, User, AlertTriangle, X, Building2, UserCheck,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TicketStatusBadge, TicketPriorityBadge, SlaBreach } from "./TicketBadges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTicket, useUpdateTicket, useAddTicketNote, useAddTicketPublicNote } from "@/lib/hooks/useTickets";
import { useAgents } from "@/lib/hooks/useAgents";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import { cn } from "@/lib/utils";
import type { TicketStatus, TicketPriority } from "@/types/ticket";

const STATUS_OPTIONS: TicketStatus[] = ["open", "in_progress", "waiting", "resolved", "closed"];
const PRIORITY_OPTIONS: TicketPriority[] = ["low", "medium", "high", "urgent"];

interface TicketDetailProps {
  ticketId: string | null;
  onClose: () => void;
}

export function TicketDetail({ ticketId, onClose }: TicketDetailProps) {
  const { data: ticket, isLoading } = useTicket(ticketId ?? "");
  const updateTicket  = useUpdateTicket();
  const addNote       = useAddTicketNote();
  const addPublicNote = useAddTicketPublicNote();
  const { data: agents = [] } = useAgents();
  const { data: departments = [] } = useDepartments();
  const currentUser = useAuthStore((s) => s.user);
  const myRole = useAuthStore((s) => s.activeWorkspace?.role);
  const isAdmin = myRole === "owner" || myRole === "admin";

  const myAgent = agents.find((a) => {
    const uid = typeof a.user_id === "object" ? a.user_id?._id : String(a.user_id);
    return uid === currentUser?._id;
  });
  const myAgentId = myAgent?._id ?? null;

  const isAvailable = !!ticket?.department_id && !ticket?.assigned_to;
  const canWrite = isAdmin || (!!myAgentId && ticket?.assigned_to?._id === myAgentId);

  const { addToast } = useNotificationsStore();

  const [noteContent, setNoteContent] = useState("");
  const [noteTab, setNoteTab] = useState<"private" | "public">("private");

  const handleUpdate = async (input: Parameters<typeof updateTicket.mutateAsync>[0]["input"]) => {
    try {
      await updateTicket.mutateAsync({ ticketId: ticketId!, input });
      addToast({ type: "success", message: "Ticket actualizado" });
    } catch {
      addToast({ type: "error", message: "No se pudo actualizar" });
    }
  };

  const handleAddNote = async () => {
    const trimmed = noteContent.trim();
    if (!trimmed) return;
    try {
      if (noteTab === "private") {
        await addNote.mutateAsync({ ticketId: ticketId!, content: trimmed });
      } else {
        await addPublicNote.mutateAsync({ ticketId: ticketId!, content: trimmed });
      }
      setNoteContent("");
      addToast({ type: "success", message: noteTab === "private" ? "Nota interna agregada" : "Nota pública publicada" });
    } catch {
      addToast({ type: "error", message: "No se pudo agregar la nota" });
    }
  };

  const handleTakeTicket = async () => {
    if (!myAgentId) return;
    try {
      await updateTicket.mutateAsync({ ticketId: ticketId!, input: { assigned_to: myAgentId } });
      addToast({ type: "success", message: "Ticket tomado — ahora está asignado a ti" });
    } catch {
      addToast({ type: "error", message: "No se pudo tomar el ticket" });
    }
  };

  const isPendingNote = addNote.isPending || addPublicNote.isPending;

  const contactName  = ticket?.contact_id?.name ?? ticket?.contact_id?.email ?? "Contacto";
  const contactEmail = ticket?.contact_id?.email;
  const createdAt    = ticket ? format(new Date(ticket.createdAt), "d MMM yyyy, HH:mm", { locale: es }) : "";
  const resolvedAt   = ticket?.resolved_at ? format(new Date(ticket.resolved_at), "d MMM yyyy, HH:mm", { locale: es }) : null;
  const slaDate      = ticket?.sla_due_at ? format(new Date(ticket.sla_due_at), "d MMM yyyy, HH:mm", { locale: es }) : null;
  const onlineAgents = agents.filter((a) => a.active);
  const privateNotes = ticket?.internal_notes ?? [];
  const publicNotes  = ticket?.public_notes ?? [];

  return (
    <Dialog open={!!ticketId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none sm:p-6">
          <div className="w-full max-w-5xl bg-background rounded-xl shadow-2xl ring-1 ring-border flex flex-col overflow-hidden"
               style={{ height: "min(85vh, 760px)" }}>

            {/* ── HEADER ── */}
            <div className="flex items-start gap-3 px-6 py-4 border-b shrink-0">
              <div className="flex-1 min-w-0">
                {isLoading || !ticket ? (
                  <p className="text-sm font-semibold text-muted-foreground">Cargando…</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {ticket.sla_breach && (
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                      )}
                      <h2 className="text-base font-semibold leading-snug truncate">
                        {ticket.title}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {contactName}
                      {contactEmail && contactEmail !== contactName && (
                        <span className="ml-1 opacity-60">· {contactEmail}</span>
                      )}
                    </p>
                  </>
                )}
              </div>
              <DialogPrimitive.Close
                className="shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {/* ── BODY ── */}
            {isLoading || !ticket ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex flex-1 min-h-0">

                {/* ── LEFT: detalles ── */}
                <div className="w-72 shrink-0 border-r overflow-y-auto">
                  <div className="p-5 space-y-5">

                    {/* Descripción */}
                    {ticket.description && (
                      <section>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Descripción
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {ticket.description}
                        </p>
                      </section>
                    )}

                    {/* Control */}
                    <section>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Control del ticket
                      </p>
                      <div className="space-y-1 divide-y divide-border/60">

                        {/* Estado */}
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Estado</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={updateTicket.isPending}
                              className="flex items-center gap-1 outline-none hover:opacity-70 transition-opacity"
                            >
                              <TicketStatusBadge status={ticket.status} />
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {STATUS_OPTIONS.map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => handleUpdate({ status: s })}
                                  className={cn(ticket.status === s && "bg-accent font-medium")}
                                >
                                  <TicketStatusBadge status={s} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Prioridad */}
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Prioridad</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={updateTicket.isPending}
                              className="flex items-center gap-1 outline-none hover:opacity-70 transition-opacity"
                            >
                              <TicketPriorityBadge priority={ticket.priority} />
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {PRIORITY_OPTIONS.map((p) => (
                                <DropdownMenuItem
                                  key={p}
                                  onClick={() => handleUpdate({ priority: p })}
                                  className={cn(ticket.priority === p && "bg-accent font-medium")}
                                >
                                  <TicketPriorityBadge priority={p} />
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Departamento */}
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Departamento</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={updateTicket.isPending}
                              className="flex items-center gap-1.5 text-sm outline-none hover:opacity-70 transition-opacity"
                            >
                              {ticket.department_id ? (
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: ticket.department_id.color ?? "#6366f1" }}
                                  />
                                  <span className="max-w-[110px] truncate">{ticket.department_id.name}</span>
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <Building2 className="h-3.5 w-3.5" />
                                  Sin departamento
                                </span>
                              )}
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onMouseDown={() => handleUpdate({ department_id: null, assigned_to: null })}
                              >
                                Sin departamento
                              </DropdownMenuItem>
                              {departments.map((dept) => (
                                <DropdownMenuItem
                                  key={dept._id}
                                  onMouseDown={() => handleUpdate({ department_id: dept._id, assigned_to: null })}
                                  className={cn(ticket.department_id?._id === dept._id && "bg-accent font-medium")}
                                >
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="h-2 w-2 rounded-full shrink-0"
                                      style={{ backgroundColor: dept.color ?? "#6366f1" }}
                                    />
                                    {dept.name}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Agente */}
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-muted-foreground">Agente</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={updateTicket.isPending}
                              className="flex items-center gap-1.5 text-sm outline-none hover:opacity-70 transition-opacity"
                            >
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="max-w-[110px] truncate">
                                {ticket.assigned_to?.user_id?.name ?? "Sin asignar"}
                              </span>
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onMouseDown={() => handleUpdate({ assigned_to: null })}>
                                Sin asignar
                              </DropdownMenuItem>
                              {onlineAgents.map((agent) => (
                                <DropdownMenuItem
                                  key={agent._id}
                                  onMouseDown={() => handleUpdate({ assigned_to: agent._id })}
                                  className={cn(ticket.assigned_to?._id === agent._id && "bg-accent font-medium")}
                                >
                                  {agent.user_id?.name ?? agent.user?.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </section>

                    {/* Info */}
                    <section>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Información
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>Creado: {createdAt}</span>
                        </div>
                        {resolvedAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>Resuelto: {resolvedAt}</span>
                          </div>
                        )}
                        {slaDate && (
                          <div className={cn(
                            "flex items-center gap-2 text-sm",
                            ticket.sla_breach ? "text-red-600" : "text-muted-foreground"
                          )}>
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>SLA: {slaDate}</span>
                          </div>
                        )}
                        {ticket.tags.length > 0 && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Tag className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{ticket.tags.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </section>

                  </div>
                </div>

                {/* ── RIGHT: notas ── */}
                <div className="flex-1 flex flex-col min-w-0">

                  {/* Banner Tomar ticket */}
                  {isAvailable && !canWrite && (
                    <div className="shrink-0 mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                        <UserCheck className="h-4 w-4 shrink-0" />
                        <span>Este ticket está disponible para tu departamento</span>
                      </div>
                      <button
                        onClick={handleTakeTicket}
                        disabled={updateTicket.isPending || !myAgentId}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updateTicket.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        Tomar ticket
                      </button>
                    </div>
                  )}

                  {/* Tabs */}
                  <div className="flex shrink-0 border-b bg-muted/30">
                    <button
                      onClick={() => setNoteTab("private")}
                      className={cn(
                        "flex items-center gap-2 px-5 h-11 text-sm font-medium border-b-2 transition-colors",
                        noteTab === "private"
                          ? "border-yellow-500 text-yellow-700 dark:text-yellow-400"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Notas internas
                      <span className={cn(
                        "inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold",
                        noteTab === "private"
                          ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {privateNotes.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setNoteTab("public")}
                      className={cn(
                        "flex items-center gap-2 px-5 h-11 text-sm font-medium border-b-2 transition-colors",
                        noteTab === "public"
                          ? "border-sky-500 text-sky-700 dark:text-sky-400"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Notas públicas
                      <span className={cn(
                        "inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold",
                        noteTab === "public"
                          ? "bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {publicNotes.length}
                      </span>
                    </button>
                  </div>

                  {/* Lista de notas */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {noteTab === "private" ? (
                      privateNotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-5 w-5 opacity-40" />
                          </div>
                          <p className="text-sm">Sin notas internas aún</p>
                          <p className="text-xs opacity-60">Solo el equipo puede ver estas notas</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {privateNotes.map((note, i) => (
                            <div key={i} className="rounded-lg border border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-3">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(note.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      publicNotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Globe className="h-5 w-5 opacity-40" />
                          </div>
                          <p className="text-sm">Sin notas públicas aún</p>
                          <p className="text-xs opacity-60">El cliente verá estas notas por email</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {publicNotes.map((note, i) => (
                            <div key={i} className="rounded-lg border border-sky-200 dark:border-sky-800/40 bg-sky-50 dark:bg-sky-900/10 px-4 py-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Globe className="h-3 w-3 text-sky-500" />
                                <span className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                                  Visible para el cliente
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(new Date(note.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  {/* Input de nota */}
                  <div className={cn(
                    "shrink-0 px-6 py-4 border-t space-y-3",
                    noteTab === "public" && "bg-sky-50/50 dark:bg-sky-950/20"
                  )}>
                    {noteTab === "public" && (
                      <div className="flex items-start gap-2 text-xs text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30 rounded-md px-3 py-2">
                        <Globe className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>Esta nota será enviada por email al cliente si tiene correo registrado.</span>
                      </div>
                    )}
                    <Textarea
                      placeholder={
                        !canWrite
                          ? "Debes tomar el ticket antes de escribir..."
                          : noteTab === "private"
                          ? "Escribe una nota interna — solo visible para el equipo..."
                          : "Escribe una actualización para el cliente..."
                      }
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                      disabled={!canWrite}
                      className={cn(
                        "resize-none text-sm",
                        !canWrite && "opacity-50 cursor-not-allowed",
                        noteTab === "public" && canWrite && "border-sky-300 dark:border-sky-700 focus-visible:ring-sky-400"
                      )}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!canWrite || !noteContent.trim() || isPendingNote}
                      className={cn(
                        "w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                        noteTab === "private"
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          : "bg-sky-600 text-white hover:bg-sky-700"
                      )}
                    >
                      {isPendingNote ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : noteTab === "private" ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      {noteTab === "private" ? "Agregar nota interna" : "Publicar actualización al cliente"}
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
