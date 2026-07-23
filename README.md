# NexoraChat — Panel de Administración

Panel de administración web de **NexoraChat**, una plataforma **multi-tenant (SaaS)** de atención al cliente omnicanal impulsada por agentes de IA. Desde este panel los equipos gestionan conversaciones en tiempo real, contactos, leads, tickets, campañas, bots de IA, ventas/cobros y la configuración de cada workspace.

Este repositorio contiene únicamente el **frontend** (Next.js). Consume una API REST + WebSocket externa (backend no incluido en este repo).

---

## ✨ Características principales

### Área de trabajo (Dashboard por workspace)
Las rutas viven bajo `/[workspaceSlug]/...`, permitiendo que un mismo usuario opere varios espacios de trabajo:

- **Conversaciones** — Bandeja unificada en tiempo real (Socket.IO) con panel de chat, envío de mensajes, indicador de escritura, asignación de agentes, transferencia entre departamentos, resolución y reapertura de conversaciones, y generación de enlaces de pago.
- **Contactos** — Tabla con búsqueda, paginación, campos personalizados y ficha de detalle.
- **Leads** — Tablero tipo **Kanban** (arrastrar y soltar) con columnas por etapa, tarjetas y hoja de detalle.
- **Tickets** — Listado con filtros, badges de estado/prioridad, creación y detalle de tickets de soporte.
- **Analytics** — KPIs, gráficos por canal, tabla de rendimiento por agente y selector de rango de fechas.
- **Bot e IA** — Editor de agentes de IA, bot de decisiones, editor visual de flujos (`@xyflow/react` + Dagre), base de conocimiento, vista previa del prompt y chat de prueba del bot.
- **Campañas** — Asistente (wizard) de creación de campañas, listado, detalle y estadísticas de envío.
- **Ventas y Cobro** — Productos, pasarelas de pago, enlaces de pago e integraciones ERP.
- **Configuración** (solo `owner`) — General, Bot e IA, Branding, Comportamiento, Canales, Integraciones, Equipo y Facturación.

### Canales omnicanal
Configuración de múltiples canales de mensajería:
- **WhatsApp Business API (Oficial)**
- **WhatsApp vía Baileys (No oficial)** — con panel de conexión por código QR y advertencias de riesgo integradas.
- **Telegram**
- **Facebook Messenger**
- **Instagram**
- **Webchat** — diseñador de widget embebible con vista previa y formulario pre-chat.
- **Email**

### Proveedores de IA
Soporte para configurar distintos proveedores de modelos:
- **Claude (Anthropic)**
- **OpenAI (GPT)**
- **Google Gemini**
- **Groq**
- **Ollama (Local)**

Incluye reindexado de base de conocimiento para RAG.

### Panel de Super Admin
Área separada bajo `/superadmin` (protegida por middleware) para la operación del SaaS:
- Dashboard y estadísticas globales
- Gestión de workspaces (suspender/activar, cambiar de plan, otorgar trials)
- Gestión de usuarios
- Definición de planes y precios
- Cupones de descuento
- Facturación e invoices

### Multi-idioma
Interfaz con soporte para **Español**, **English** y **Português**.

---

## 🛠️ Stack tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) + React 18 |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) + Radix / Base UI |
| Estado global | [Zustand](https://zustand-demo.pmnd.rs/) (con persistencia en `localStorage`) |
| Datos / caché | [TanStack Query](https://tanstack.com/query) (React Query) |
| HTTP | Axios (con interceptores de JWT y manejo global de 401) |
| Tiempo real | Socket.IO Client |
| Formularios | React Hook Form + Zod |
| Gráficos | Recharts |
| Flujos / diagramas | `@xyflow/react` + `@dagrejs/dagre` |
| Drag & Drop | `react-beautiful-dnd` |
| Notificaciones | Sonner |
| Iconos | Lucide React |
| Temas | next-themes |

---

## 📁 Estructura del proyecto

```
admin/
├── app/                          # App Router de Next.js
│   ├── (auth)/                   # Login, registro, recuperación de contraseña
│   ├── (dashboard)/              # Panel principal por workspace
│   │   └── [workspaceSlug]/      # Rutas: conversations, contacts, leads,
│   │                             #        tickets, analytics, bot, campaigns,
│   │                             #        ventas, settings
│   ├── (superadmin)/             # Panel de super administrador
│   ├── layout.tsx                # Layout raíz (metadata, fuentes, providers)
│   └── page.tsx                  # Redirige a /login
├── components/                   # Componentes por dominio
│   ├── analytics/  bot/  campaigns/  contacts/  conversations/
│   ├── knowledge/  layout/  leads/  settings/  tickets/  webchat/
│   └── ui/                       # Componentes base (shadcn/ui)
├── lib/
│   ├── api.ts                    # Instancia de Axios (API de tenant)
│   ├── api-superadmin.ts         # Instancia de Axios (Super Admin)
│   ├── socket.ts                 # Cliente Socket.IO
│   ├── hooks/                    # Hooks de datos (React Query) por dominio
│   └── stores/                   # Stores de Zustand (auth, ui, conversations…)
├── types/                        # Tipos TypeScript compartidos
├── middleware.ts                 # Protección de rutas /superadmin
└── ecosystem.config.js           # Configuración de despliegue con PM2
```

---

## 🚀 Puesta en marcha

### Requisitos previos
- Node.js 18+ 
- Un backend de NexoraChat en ejecución que exponga la API REST y el servidor de WebSocket.

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Crea un archivo `.env.local` en la raíz con las URLs del backend:

```bash
# URL base de la API REST del backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# URL del servidor de WebSocket (Socket.IO)
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### 3. Entorno de desarrollo

```bash
npm run dev
```

La aplicación quedará disponible en [http://localhost:3000](http://localhost:3000) (redirige a `/login`).

---

## 📜 Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la build de producción |
| `npm run start` | Sirve la build de producción |
| `npm run lint` | Ejecuta el linter de Next.js |

---

## 🔒 Autenticación y seguridad

- La sesión se autentica con **JWT**, almacenado por Zustand en `localStorage` (clave `trivox-auth`).
- El token se adjunta automáticamente a cada petición mediante un interceptor de Axios.
- Ante una respuesta **401**, la sesión se limpia y se redirige a `/login`.
- El área `/superadmin` está protegida por `middleware.ts`, que exige una cookie espejo (`sa_token_mirror`) y redirige a `/superadmin/login` si no está presente.
- El acceso a **Configuración** está restringido a usuarios con rol `owner`.

---

## 📦 Despliegue

Incluye un `ecosystem.config.js` para desplegar con **PM2** en modo producción (por defecto en el puerto `3001`):

```bash
npm run build
pm2 start ecosystem.config.js
```

---

## 📄 Licencia

Proyecto privado. Todos los derechos reservados.
