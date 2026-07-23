import { Zap, MessageSquare, Bot, Shield, BarChart2 } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Conversaciones unificadas",
    desc: "WhatsApp, Instagram, web y más en un solo panel.",
  },
  {
    icon: Bot,
    title: "Bot con IA integrada",
    desc: "Automatiza respuestas y crea flujos sin código.",
  },
  {
    icon: BarChart2,
    title: "Analytics en tiempo real",
    desc: "Métricas de rendimiento y satisfacción del cliente.",
  },
  {
    icon: Shield,
    title: "White-label listo",
    desc: "Tu marca, tus colores, tu dominio. 100% personalizable.",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">

      {/* ── Brand panel (left) ────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-10 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, hsl(222 47% 7%) 0%, hsl(231 60% 14%) 50%, hsl(222 47% 8%) 100%)",
        }}
      >
        {/* Glow blobs */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(231 90% 60%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full opacity-10 blur-3xl"
          style={{ background: "hsl(262 80% 58%)" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              NexoraChat
            </span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              La plataforma que{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, hsl(231 90% 75%), hsl(262 80% 75%))",
                }}
              >
                transforma
              </span>{" "}
              tus conversaciones
            </h1>
            <p className="mt-3 text-base text-white/50 leading-relaxed max-w-sm">
              CRM conversacional, bot builder e IA unificados para equipos que quieren crecer sin fricción.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[8%] ring-1 ring-white/10">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white/90">{title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} NexoraChat · Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* ── Form panel (right) ───────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">

        {/* Mobile-only logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md shadow-primary/20">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">NexoraChat</span>
        </div>

        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
