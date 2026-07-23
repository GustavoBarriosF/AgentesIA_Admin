"use client";

import { useState } from "react";
import {
  Loader2, Save, Trash2, Zap, Eye, EyeOff,
  CheckCircle2, XCircle, ChevronLeft, RefreshCw,
  AlertCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useERPIntegrations,
  useCreateERPIntegration,
  useUpdateERPIntegration,
  useDeleteERPIntegration,
  useTestERPConnection,
  useERPSyncLog,
  type ERPProvider,
  type ERPIntegration,
} from "@/lib/hooks/useERPIntegrations";

// ─── Configuración de proveedores ─────────────────────────────────────────────

interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password";
  placeholder: string;
}

interface ProviderDef {
  id: ERPProvider;
  label: string;
  icon: string;
  region: string;
  description: string;
  credentials: CredentialField[];
  note?: string;
}

const PROVIDERS: ProviderDef[] = [
  {
    id: "alegra",
    label: "Alegra",
    icon: "🟢",
    region: "Colombia / LATAM",
    description: "Facturación, clientes y pagos. API REST bien documentada.",
    credentials: [
      { key: "email",  label: "Email de la cuenta",  type: "text",     placeholder: "usuario@empresa.com" },
      { key: "token",  label: "Token de API",         type: "password", placeholder: "tu-token-de-alegra" },
    ],
    note: "Obtén el token en Alegra → Configuración → API.",
  },
  {
    id: "siigo",
    label: "Siigo",
    icon: "🔵",
    region: "Colombia",
    description: "Líder en facturación electrónica DIAN, cartera y cobranza.",
    credentials: [
      { key: "username",   label: "Usuario (email)",  type: "text",     placeholder: "usuario@empresa.com" },
      { key: "access_key", label: "Clave de acceso",  type: "password", placeholder: "tu-access-key-de-siigo" },
    ],
    note: "Solicita las credenciales de API en el portal de Siigo.",
  },
  {
    id: "quickbooks",
    label: "QuickBooks Online",
    icon: "🟣",
    region: "Global / USA",
    description: "ERP de Intuit con OAuth2. Facturas, clientes y pagos.",
    credentials: [
      { key: "client_id",     label: "Client ID",      type: "text",     placeholder: "ABcd..." },
      { key: "client_secret", label: "Client Secret",  type: "password", placeholder: "secret..." },
      { key: "realm_id",      label: "Realm ID (Company ID)", type: "text", placeholder: "123456789" },
      { key: "refresh_token", label: "Refresh Token",  type: "password", placeholder: "token de larga duración" },
    ],
    note: "Crea una app en Intuit Developer Portal y completa el flujo OAuth2 para obtener el refresh_token.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function isConfigured(integration: ERPIntegration | undefined) {
  if (!integration) return false;
  return integration.active && !!integration.credentials_configured?._encrypted;
}

// ─── Vista lista ──────────────────────────────────────────────────────────────

interface ListViewProps {
  integrations: ERPIntegration[];
  onSelect: (provider: ERPProvider) => void;
}

function ListView({ integrations, onSelect }: ListViewProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Conecta tu sistema contable para que el bot pueda consultar clientes,
        facturas y estados de cuenta en tiempo real. Cada workspace usa sus propias credenciales.
      </p>
      {PROVIDERS.map((p) => {
        const integration = integrations.find((i) => i.provider === p.id);
        const configured  = isConfigured(integration);
        return (
          <div
            key={p.id}
            className="rounded-lg border p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
          >
            <span className="text-2xl shrink-0">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{p.label}</p>
                <span className="text-xs text-muted-foreground">{p.region}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              {configured && integration?.last_sync && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Última sync: {formatDate(integration.last_sync)}
                </p>
              )}
            </div>
            {configured && (
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 shrink-0">
                ✓ Activo
              </Badge>
            )}
            <Button
              size="sm"
              variant={configured ? "outline" : "default"}
              onClick={() => onSelect(p.id)}
              className="shrink-0"
            >
              {configured ? "Configurar" : "Conectar"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Vista detalle ────────────────────────────────────────────────────────────

interface DetailViewProps {
  provider: ERPProvider;
  integration: ERPIntegration | undefined;
  onBack: () => void;
}

function DetailView({ provider, integration, onBack }: DetailViewProps) {
  const def = PROVIDERS.find((p) => p.id === provider)!;

  const [creds,      setCreds]      = useState<Record<string, string>>({});
  const [currency,   setCurrency]   = useState(integration?.config?.currency ?? "COP");
  const [companyName,setCompanyName]= useState(integration?.config?.company_name ?? "");
  const [sandbox,    setSandbox]    = useState(
    (integration?.credentials_configured as Record<string, unknown>)?.sandbox === true
  );
  const [showField,  setShowField]  = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [showLog,    setShowLog]    = useState(false);

  const create    = useCreateERPIntegration();
  const update    = useUpdateERPIntegration();
  const remove    = useDeleteERPIntegration();
  const testConn  = useTestERPConnection();
  const { data: logData, isLoading: logLoading, refetch: refetchLog } = useERPSyncLog(
    showLog ? (integration?._id ?? null) : null
  );

  const isSaving = create.isPending || update.isPending;

  const handleSave = async () => {
    const config = {
      currency,
      company_name: companyName || undefined,
    };
    const credentials = { ...creds };
    if (provider === "quickbooks") credentials.sandbox = String(sandbox);

    if (integration) {
      await update.mutateAsync({ id: integration._id, credentials, config });
    } else {
      await create.mutateAsync({ provider, credentials, config });
    }
    onBack();
  };

  const handleTest = async () => {
    // Si hay credenciales nuevas, guardar primero
    if (Object.values(creds).some(Boolean)) {
      const config = { currency, company_name: companyName || undefined };
      const credentials = { ...creds };
      if (provider === "quickbooks") credentials.sandbox = String(sandbox);

      if (integration) {
        await update.mutateAsync({ id: integration._id, credentials, config });
      } else {
        await create.mutateAsync({ provider, credentials, config });
      }
    }
    if (!integration && !Object.values(creds).some(Boolean)) return;

    // Necesitamos el _id — si acaba de crearse, refrescar
    const targetId = integration?._id;
    if (!targetId) return;

    const result = await testConn.mutateAsync(targetId);
    setTestResult(result);
  };

  const handleDelete = async () => {
    if (!integration) return;
    await remove.mutateAsync(integration._id);
    onBack();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />Volver
        </Button>
        <span className="text-sm font-medium">
          {def.icon} {def.label}
        </span>
        {integration && (
          <Badge
            variant="outline"
            className={integration.active
              ? "text-green-700 border-green-300 bg-green-50"
              : "text-muted-foreground"}
          >
            {integration.active ? "Activo" : "Inactivo"}
          </Badge>
        )}
      </div>

      {/* Nota del proveedor */}
      {def.note && (
        <div className="flex gap-2 rounded-md bg-muted/50 border p-3 text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          {def.note}
        </div>
      )}

      {/* Campos de credenciales */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Credenciales</p>
        {def.credentials.map((f) => {
          const isSet = integration?.credentials_configured?._encrypted === true;
          return (
            <div key={f.key} className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                {f.label}
                {isSet && (
                  <span className="text-xs font-normal text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                    ✓ Configurado
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  type={f.type === "password" && !showField[f.key] ? "password" : "text"}
                  placeholder={isSet ? "•••••••• (vacío = sin cambiar)" : f.placeholder}
                  value={creds[f.key] ?? ""}
                  onChange={(e) => setCreds((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="font-mono text-sm"
                />
                {f.type === "password" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowField((s) => ({ ...s, [f.key]: !s[f.key] }))}
                  >
                    {showField[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modo sandbox para QuickBooks */}
      {provider === "quickbooks" && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Modo Sandbox</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Usa el entorno de pruebas de Intuit. Los datos no son reales.
            </p>
          </div>
          <Switch checked={sandbox} onCheckedChange={setSandbox} />
        </div>
      )}

      <Separator />

      {/* Config general */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Configuración</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Moneda</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              placeholder="COP"
              maxLength={3}
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Nombre de la empresa</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Mi Empresa S.A.S."
            />
          </div>
        </div>
      </div>

      {/* Resultado del test */}
      {testResult && (
        <div
          className={`rounded-md p-3 text-sm border flex items-start gap-2 ${
            testResult.valid
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {testResult.valid
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            : <XCircle     className="h-4 w-4 shrink-0 mt-0.5" />}
          <span>
            {testResult.valid
              ? "Conexión exitosa. Las credenciales son válidas."
              : `Error: ${testResult.error}`}
          </span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving
            ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
            : <Save     className="h-4 w-4 mr-1" />}
          Guardar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={testConn.isPending || isSaving}
        >
          {testConn.isPending
            ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
            : <Zap     className="h-4 w-4 mr-1" />}
          Probar conexión
        </Button>
        {integration && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive ml-auto"
            onClick={handleDelete}
            disabled={remove.isPending}
          >
            {remove.isPending
              ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
              : <Trash2  className="h-4 w-4 mr-1" />}
            Desconectar
          </Button>
        )}
      </div>

      {/* Sync Log */}
      {integration && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Historial de sincronizaciones</p>
              <div className="flex gap-2">
                {showLog && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => refetchLog()}
                    disabled={logLoading}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${logLoading ? "animate-spin" : ""}`} />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLog((v) => !v)}
                >
                  {showLog ? "Ocultar" : "Ver log"}
                </Button>
              </div>
            </div>

            {showLog && (
              <>
                {logLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full rounded" />
                    ))}
                  </div>
                ) : !logData?.sync_log?.length ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Sin operaciones registradas aún.
                  </p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Fecha</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Acción</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Estado</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {logData.sync_log.slice(0, 20).map((entry, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                              {formatDate(entry.timestamp)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">
                              {entry.action}
                            </td>
                            <td className="px-3 py-2">
                              {entry.status === "success" ? (
                                <span className="flex items-center gap-1 text-green-700">
                                  <CheckCircle2 className="h-3 w-3" /> OK
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600">
                                  <XCircle className="h-3 w-3" /> Error
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">
                              {entry.detail ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ERPIntegrationsTab() {
  const { data: integrations = [], isLoading } = useERPIntegrations();
  const [selectedProvider, setSelectedProvider] = useState<ERPProvider | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (selectedProvider) {
    const integration = integrations.find((i) => i.provider === selectedProvider);
    return (
      <DetailView
        provider={selectedProvider}
        integration={integration}
        onBack={() => setSelectedProvider(null)}
      />
    );
  }

  return (
    <ListView
      integrations={integrations}
      onSelect={setSelectedProvider}
    />
  );
}
