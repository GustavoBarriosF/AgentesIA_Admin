import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthGuard } from "@/components/layout/auth-guard";
import { SocketProvider } from "@/components/layout/socket-provider";
import { WorkspaceTheme } from "@/components/layout/workspace-theme";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SocketProvider>
        <WorkspaceTheme />
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <Header />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
        <Toaster richColors position="bottom-right" />
      </SocketProvider>
    </AuthGuard>
  );
}
