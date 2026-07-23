"use client";

import { Loader2, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgents } from "@/lib/hooks/useAgents";
import { useDepartments } from "@/lib/hooks/useDepartments";
import { useAssignConversation, useAssignDepartment } from "@/lib/hooks/useConversations";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import { cn } from "@/lib/utils";

interface AgentAssignPickerProps {
  convId: string;
  currentAgentId?: string;
  currentDepartmentId?: string;
}

export function AgentAssignPicker({ convId, currentAgentId, currentDepartmentId }: AgentAssignPickerProps) {
  const { data: agents = [] }      = useAgents();
  const { data: departments = [] } = useDepartments();
  const assign       = useAssignConversation();
  const assignDept   = useAssignDepartment();
  const { addToast } = useNotificationsStore();

  const isPending = assign.isPending || assignDept.isPending;

  const activeAgents = agents
    .filter((a) => a.active)
    .sort((a, b) => {
      if (a.status === "online" && b.status !== "online") return -1;
      if (a.status !== "online" && b.status === "online") return 1;
      return 0;
    });

  const handleAssignAgent = async (agentId: string) => {
    try {
      await assign.mutateAsync({ convId, agentId });
      addToast({ type: "success", message: "Conversación asignada al agente" });
    } catch {
      addToast({ type: "error", message: "No se pudo asignar" });
    }
  };

  const handleAssignDept = async (departmentId: string) => {
    try {
      await assignDept.mutateAsync({ convId, departmentId });
      addToast({ type: "success", message: "Conversación asignada al departamento" });
    } catch {
      addToast({ type: "error", message: "No se pudo asignar al departamento" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors outline-none",
          "border border-border hover:bg-muted"
        )}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <UserPlus className="h-3 w-3" />
        )}
        Asignar
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">

        {/* ── Departamentos ── */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <Users className="h-3 w-3" /> Departamentos
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {departments.length === 0 ? (
            <div className="py-2 px-3 text-xs text-muted-foreground">Sin departamentos</div>
          ) : (
            departments.map((dept) => {
              const isCurrent = dept._id === currentDepartmentId;
              return (
                <DropdownMenuItem
                  key={dept._id}
                  onClick={() => handleAssignDept(dept._id)}
                  disabled={isCurrent}
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: dept.color ?? "#6366f1" }}
                  />
                  <span className="truncate">{dept.name}</span>
                  {isCurrent && (
                    <span className="ml-auto text-[10px] text-muted-foreground">actual</span>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* ── Agentes ── */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <UserPlus className="h-3 w-3" /> Agentes
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {activeAgents.length === 0 ? (
            <div className="py-2 px-3 text-xs text-muted-foreground">Sin agentes activos</div>
          ) : (
            activeAgents.map((agent) => {
              const name     = agent.user_id?.name ?? agent.user?.name ?? "Agente";
              const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              const isCurrent = agent._id === currentAgentId;
              const isOnline  = agent.status === "online";

              return (
                <DropdownMenuItem
                  key={agent._id}
                  onClick={() => handleAssignAgent(agent._id)}
                  disabled={isCurrent}
                  className="flex items-center gap-2"
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                    </Avatar>
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background",
                      isOnline ? "bg-green-500" : "bg-muted-foreground/40"
                    )} />
                  </div>
                  <span className="truncate">{name}</span>
                  {isCurrent && (
                    <span className="ml-auto text-[10px] text-muted-foreground">actual</span>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuGroup>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
