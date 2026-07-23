"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare, Users, Kanban, Ticket, BarChart2,
  Bot, Megaphone, ShoppingCart, Settings,
  PanelLeftClose, PanelLeftOpen, Zap,
  ChevronRight, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui.store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ─── Navigation definition ─────────────────────────────────────────────────────

const mainNav = [
  { label: "Conversaciones", href: "conversations", icon: MessageSquare },
  { label: "Contactos",      href: "contacts",      icon: Users         },
  { label: "Leads",          href: "leads",         icon: Kanban        },
  { label: "Tickets",        href: "tickets",       icon: Ticket        },
  { label: "Analytics",      href: "analytics",     icon: BarChart2     },
  { label: "Bot e IA",       href: "bot",           icon: Bot           },
  { label: "Campañas",       href: "campaigns",     icon: Megaphone     },
  { label: "Ventas y Cobro", href: "ventas",        icon: ShoppingCart  },
];

const bottomNav = [
  { label: "Configuración",  href: "settings",      icon: Settings      },
];

// ─── NavItem ───────────────────────────────────────────────────────────────────

type NavEntry = typeof mainNav[0];

function NavItem({ item, slug, collapsed }: { item: NavEntry; slug: string; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname.startsWith(`/${slug}/${item.href}`);
  const href = `/${slug}/${item.href}`;
  const Icon = item.icon;

  const baseClass = cn(
    "group relative flex items-center gap-3 rounded-lg transition-all duration-150 select-none",
    collapsed ? "h-9 w-9 justify-center mx-auto" : "h-9 px-2.5",
    active
      ? "bg-white/10 text-white"
      : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-white/5"
  );

  const content = (
    <>
      {/* Active indicator bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-white/90" />
      )}
      <Icon className={cn(
        "shrink-0 transition-colors",
        collapsed ? "h-[18px] w-[18px]" : "h-4 w-4",
        active ? "text-white" : "group-hover:text-sidebar-foreground"
      )} />
      {!collapsed && (
        <span className="truncate text-sm font-medium">{item.label}</span>
      )}
    </>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<Link href={href} className={baseClass} />}>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right" className="font-medium text-xs">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return <Link href={href} className={baseClass}>{content}</Link>;
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, activeWorkspace, logout } = useAuthStore();
  const slug = activeWorkspace?.workspace?.slug ?? "";
  const wsName = activeWorkspace?.workspace?.name ?? "NexoraChat";
  const role = activeWorkspace?.role ?? "";

  const initials = wsName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full shrink-0 transition-all duration-200 overflow-hidden",
        "bg-sidebar border-r border-sidebar-border",
        sidebarCollapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Subtle top gradient glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-20"
        style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(var(--sidebar-active)) 0%, transparent 70%)" }}
      />

      {/* ── Brand / Workspace ───────────────────────────────── */}
      <div className={cn(
        "relative z-10 flex items-center gap-2.5 h-14 shrink-0 px-3 border-b border-sidebar-border",
        sidebarCollapsed && "justify-center px-0"
      )}>
        {/* Logo mark — shows workspace logo if available, else icon */}
        <div className={cn(
          "flex items-center justify-center rounded-lg shrink-0 overflow-hidden",
          "bg-gradient-to-br from-primary to-secondary shadow-md shadow-primary/30",
          sidebarCollapsed ? "h-8 w-8" : "h-8 w-8"
        )}>
          {activeWorkspace?.workspace?.branding?.logo_url ? (
            <img
              src={activeWorkspace.workspace.branding.logo_url}
              alt={wsName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Zap className="h-4 w-4 text-white" />
          )}
        </div>

        {!sidebarCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
                {wsName}
              </p>
              <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest leading-tight mt-0.5">
                {role}
              </p>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-white/5 transition-colors shrink-0"
              aria-label="Colapsar sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* ── Main navigation ─────────────────────────────────── */}
      <nav className="relative z-10 flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center h-9 w-9 mx-auto rounded-lg text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-white/5 transition-colors mb-2"
            aria-label="Expandir sidebar"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        )}
        {mainNav.map((item) => (
          <NavItem key={item.href} item={item} slug={slug} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      {/* ── Bottom section ──────────────────────────────────── */}
      <div className="relative z-10 shrink-0">
        <div className="mx-2 border-t border-sidebar-border/50" />
        <div className="py-2 px-2 space-y-0.5">
          {activeWorkspace?.role === "owner" &&
            bottomNav.map((item) => (
              <NavItem key={item.href} item={item} slug={slug} collapsed={sidebarCollapsed} />
            ))
          }
        </div>

        {/* User profile strip */}
        <div className={cn(
          "mx-2 mb-3 flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-white/5 cursor-pointer group",
          sidebarCollapsed && "justify-center"
        )}>
          <Avatar className="h-7 w-7 shrink-0 ring-1 ring-white/10">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-[10px] font-semibold bg-primary/20 text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate leading-tight">
                  {user?.name ?? "Usuario"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate leading-tight">
                  {user?.email ?? ""}
                </p>
              </div>
              <button
                onClick={() => logout()}
                className="p-1 rounded-md opacity-0 group-hover:opacity-100 text-sidebar-foreground/40 hover:text-red-400 transition-all"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
