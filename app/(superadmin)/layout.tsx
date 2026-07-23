"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Tag,
  Ticket,
  Users2,
  LogOut,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useSuperAdminStore } from "@/lib/stores/superadmin.store";
import { Toaster } from "@/components/ui/sonner";

const navItems = [
  { href: "/superadmin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/superadmin/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/superadmin/plans", label: "Planes", icon: Ticket },
  { href: "/superadmin/coupons", label: "Cupones", icon: Tag },
  { href: "/superadmin/billing", label: "Facturación", icon: CreditCard },
  { href: "/superadmin/users", label: "Usuarios", icon: Users2 },
];

function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useSuperAdminStore((s) => s.token);
  const hydrated = useSuperAdminStore((s) => s._hydrated);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/superadmin/login");
    }
  }, [hydrated, token, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!token) return null;

  return <>{children}</>;
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const admin = useSuperAdminStore((s) => s.admin);
  const logout = useSuperAdminStore((s) => s.logout);

  // Login page has its own layout (no sidebar)
  if (pathname === "/superadmin/login") {
    return (
      <>
        {children}
        <Toaster richColors position="bottom-right" />
      </>
    );
  }

  return (
    <SuperAdminGuard>
      <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
        {/* Sidebar */}
        <aside className="flex w-60 flex-col border-r border-zinc-800 bg-zinc-900">
          {/* Logo */}
          <div className="flex items-center gap-2.5 border-b border-zinc-800 px-5 py-4">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-zinc-100">NexoraChat</p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-indigo-400">
                Super Admin
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Footer: user + logout */}
          <div className="border-t border-zinc-800 px-3 py-3">
            <div className="flex items-center justify-between rounded-md px-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {admin?.name ?? "Admin"}
                </p>
                <p className="truncate text-xs text-zinc-500">{admin?.email}</p>
              </div>
              <button
                onClick={logout}
                className="ml-2 rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <Toaster richColors position="bottom-right" />
    </SuperAdminGuard>
  );
}
