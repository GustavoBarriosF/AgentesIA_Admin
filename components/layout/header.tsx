"use client";

import { useRouter } from "next/navigation";
import { Moon, Sun, Monitor, Bell, LogOut, User, ChevronDown, Check, Building2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import { useConversationsStore } from "@/lib/stores/conversations.store";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, workspaces, activeWorkspace, setActiveWorkspace, logout } = useAuthStore();
  const { notifications, unreadCount, markAllRead } = useNotificationsStore();
  const { selectConversation } = useConversationsStore();
  const unread = unreadCount();

  const handleNotificationClick = (conversationId?: string) => {
    if (!conversationId) return;
    const slug = activeWorkspace?.workspace?.slug;
    if (!slug) return;
    selectConversation(conversationId);
    router.push(`/${slug}/conversations`);
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const handleWorkspaceChange = (ws: (typeof workspaces)[0]) => {
    setActiveWorkspace(ws);
    router.push(`/${ws.workspace.slug}/conversations`);
  };

  const roleColors: Record<string, string> = {
    owner:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    admin:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    agent:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0 gap-4">

      {/* ── Workspace switcher ──────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-muted/80 transition-colors outline-none"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Building2 className="h-3 w-3 text-primary" />
          </span>
          <span className="max-w-[160px] truncate text-foreground/90">
            {activeWorkspace?.workspace?.name ?? "Seleccionar workspace"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 shadow-card-md">
          <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-1">
            Mis workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((ws) => {
            const isActive = ws.workspace._id === activeWorkspace?.workspace._id;
            return (
              <DropdownMenuItem
                key={ws.workspace._id}
                onClick={() => handleWorkspaceChange(ws)}
                className="flex items-center gap-2.5 py-2"
              >
                <div className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {ws.workspace.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="flex-1 truncate text-sm">{ws.workspace.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium capitalize", roleColors[ws.role] ?? roleColors.viewer)}>
                    {ws.role}
                  </span>
                  {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Right actions ───────────────────────────────────── */}
      <div className="flex items-center gap-0.5">

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors outline-none"
            aria-label="Cambiar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 shadow-card-md">
            <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 text-sm">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              Claro
              {theme === "light" && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 text-sm">
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              Oscuro
              {theme === "dark" && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 text-sm">
              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
              Sistema
              {theme === "system" && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications — mark all read when opening the panel */}
        <DropdownMenu onOpenChange={(open: boolean) => { if (open) markAllRead(); }}>
          <DropdownMenuTrigger
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors outline-none"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 shadow-card-md">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notificaciones</span>
              {unread > 0 && (
                <span className="text-[10px] font-medium text-primary">{unread} nuevas</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Sin notificaciones</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn(
                    "flex-col items-start gap-1 py-2.5 cursor-pointer",
                    !n.read && "bg-primary/[3%]"
                  )}
                  onClick={() => handleNotificationClick(n.conversation_id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    <span className="font-medium text-sm">{n.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-1 pl-3.5">{n.body}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div className="w-px h-5 bg-border/70 mx-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="group inline-flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted/80 transition-colors outline-none"
            aria-label="Menú de usuario"
          >
            <Avatar className="h-7 w-7 ring-1 ring-border group-hover:ring-primary/30 transition-all">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium text-foreground/80 max-w-[100px] truncate">
              {user?.name?.split(" ")[0] ?? ""}
            </span>
            <ChevronDown className="hidden md:block h-3 w-3 text-muted-foreground/50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-card-md">
            <div className="px-3 py-2.5 border-b border-border/60">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
            </div>
            <div className="py-1">
              <DropdownMenuItem onClick={() => router.push("/profile")} className="gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="gap-2 text-sm text-destructive focus:text-destructive focus:bg-destructive/[8%]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
