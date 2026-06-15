"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  KeyRound,
  Settings,
  BarChart3,
  Shield,
  Cpu,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
  ZapOff,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Coins,
  Globe,
  ToggleLeft,
  ToggleRight,
  Activity,
  FolderOpen,
  LogIn,
  Eye,
  EyeOff,
  Bot,
  MessageSquare,
  Lock,
  Unlock,
} from "lucide-react";
import {
  getAdminStats,
  getAdminUsers,
  getSystemKeys,
  getSystemConfig,
  createSystemKey,
  updateSystemKey,
  deleteSystemKey,
  verifySystemKey,
  grantCredits,
  bulkGrantCredits,
  toggleUserActive,
  updateSystemConfig,
  UserAdminSchema,
  SystemAiKey,
  SystemConfigEntry,
} from "@/features/admin/api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { providerModels, providerHints } from "@/features/ai-keys/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "primary",
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  sub?: string;
  color?: "primary" | "success" | "warning" | "danger";
}) {
  const colors = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-500",
    warning: "border-amber-500/30 bg-amber-500/5 text-amber-500",
    danger: "border-destructive/30 bg-destructive/5 text-destructive",
  };
  return (
    <div
      className={`rounded-none border-2 ${colors[color]} p-5 font-mono shadow-[3px_3px_0_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-0.5`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-3xl font-black tabular-nums">{value}</p>
      {sub && (
        <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wide">
          {sub}
        </p>
      )}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Resumen", icon: BarChart3 },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "keys", label: "System Keys", icon: KeyRound },
  { id: "config", label: "Configuración", icon: Settings },
] as const;

type Tab = (typeof TABS)[number]["id"];

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminPanel() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => getAdminUsers(),
  });
  const keysQuery = useQuery({
    queryKey: ["admin", "system-keys"],
    queryFn: getSystemKeys,
  });
  const configQuery = useQuery({
    queryKey: ["admin", "config"],
    queryFn: getSystemConfig,
  });

  const isLoading = statsQuery.isLoading;
  const isError = statsQuery.isError;

  if (isLoading)
    return <LoadingState label="Inicializando panel de control..." />;
  if (isError)
    return <ErrorState message={getApiErrorMessage(statsQuery.error)} />;

  return (
    <div className="space-y-6 font-mono">
      {/* Tab Navigation */}
      <div className="flex border-b-2 border-border/60 gap-0 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 -mb-[2px] ${
                active
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab stats={statsQuery.data} />}
      {activeTab === "users" && (
        <UsersTab
          users={usersQuery.data?.items ?? []}
          isLoading={usersQuery.isLoading}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
          }
          queryClient={queryClient}
        />
      )}
      {activeTab === "keys" && (
        <KeysTab
          keys={keysQuery.data?.items ?? []}
          isLoading={keysQuery.isLoading}
          queryClient={queryClient}
        />
      )}
      {activeTab === "config" && (
        <ConfigTab
          config={configQuery.data ?? []}
          isLoading={configQuery.isLoading}
          queryClient={queryClient}
          totalActiveUsers={statsQuery.data?.active_users ?? 0}
          queryClientAdmin={queryClient}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
}: {
  stats: ReturnType<
    typeof useQuery<Awaited<ReturnType<typeof getAdminStats>>>
  >["data"];
}) {
  if (!stats) return null;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Users}
          label="Usuarios Registrados"
          value={stats.total_users}
          sub={`${stats.active_users} activos`}
          color="primary"
        />
        <StatCard
          icon={Activity}
          label="Análisis Generados"
          value={stats.total_analyses}
          color="success"
        />
        <StatCard
          icon={Coins}
          label="Créditos Consumidos Hoy"
          value={stats.credits_consumed_today}
          color="warning"
        />
        <StatCard
          icon={KeyRound}
          label="System Keys Totales"
          value={stats.total_system_keys}
          sub={`${stats.active_system_keys} activas`}
          color="primary"
        />
        <StatCard
          icon={Shield}
          label="System Keys Activas"
          value={stats.active_system_keys}
          color={stats.active_system_keys === 0 ? "danger" : "success"}
        />
      </div>

      {stats.active_system_keys === 0 && (
        <div className="border-2 border-destructive/30 bg-destructive/5 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-destructive text-sm uppercase tracking-wide">
              Sin System Keys activas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Los usuarios no podrán usar créditos del sistema. Ve a la pestaña
              "System Keys" para agregar una API Key maestra.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({
  users,
  isLoading,
  onRefresh,
  queryClient,
}: {
  users: UserAdminSchema[];
  isLoading: boolean;
  onRefresh: () => void;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [search, setSearch] = useState("");
  const [grantTarget, setGrantTarget] = useState<UserAdminSchema | null>(null);
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantDesc, setGrantDesc] = useState("Bono administrador");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.username ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const [grantMode, setGrantMode] = useState<"ADD" | "SUB" | "SET">("ADD");

  const grantMutation = useMutation({
    mutationFn: () => {
      let delta = grantAmount;
      if (grantMode === "SUB") delta = -grantAmount;
      if (grantMode === "SET")
        delta = grantAmount - (grantTarget?.ai_credits || 0);
      return grantCredits(grantTarget!.id, delta, grantDesc);
    },
    onSuccess: () => {
      setGrantTarget(null);
      setGrantAmount(10);
      setGrantMode("ADD");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({
      userId,
      is_active,
    }: {
      userId: string;
      is_active: boolean;
    }) => toggleUserActive(userId, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <div className="space-y-4">
      {/* Search + Refresh */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-none border-2 font-mono text-xs h-9"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          className="rounded-none border-2 h-9"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground">
          {filtered.length} usuarios
        </span>
      </div>

      {/* Grant Modal */}
      {grantTarget && (
        <div className="border-2 border-primary/40 bg-primary/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              Ajustar Créditos <span className="text-muted-foreground">|</span>{" "}
              {grantTarget.email}{" "}
              <span className="text-muted-foreground">|</span> Actual:{" "}
              <span className="text-foreground">{grantTarget.ai_credits}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={grantMode}
              onChange={(e) => setGrantMode(e.target.value as any)}
              className="h-9 px-3 border-2 border-border/60 bg-background text-xs font-mono uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-none"
            >
              <option value="ADD">Añadir</option>
              <option value="SUB">Quitar</option>
              <option value="SET">Establecer a</option>
            </select>
            <Input
              type="number"
              min="0"
              placeholder="Cantidad"
              value={grantAmount}
              onChange={(e) => setGrantAmount(Number(e.target.value))}
              className="rounded-none border-2 font-mono text-sm h-9 w-28"
            />
            <Input
              placeholder="Motivo (opcional)"
              value={grantDesc}
              onChange={(e) => setGrantDesc(e.target.value)}
              className="rounded-none border-2 font-mono text-xs h-9 flex-1 min-w-[200px]"
            />
            <Button
              size="sm"
              disabled={
                grantMutation.isPending ||
                (grantMode === "SET" && grantAmount === grantTarget.ai_credits)
              }
              onClick={() => grantMutation.mutate()}
              className="rounded-none h-9 whitespace-nowrap"
            >
              {grantMutation.isPending ? "Aplicando..." : "Aplicar Ajuste"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setGrantTarget(null);
                setGrantMode("ADD");
              }}
              className="rounded-none h-9"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <LoadingState label="Cargando usuarios..." />
      ) : (
        <div className="border-2 border-border/60 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/40 border-b-2 border-border/60">
              <tr>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Usuario
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                  Proyectos
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                  Créditos
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Último Login
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm truncate max-w-[220px]">
                      {user.email}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {user.username ? `@${user.username}` : "sin username"} ·{" "}
                      {user.role}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                      <FolderOpen className="h-3 w-3" />
                      {user.project_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-mono font-bold text-sm ${user.ai_credits === 0 ? "text-destructive" : user.ai_credits <= 2 ? "text-amber-500" : "text-emerald-500"}`}
                    >
                      {user.ai_credits}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {user.last_login_at ? (
                      <span className="flex items-center gap-1">
                        <LogIn className="h-3 w-3" />
                        {new Date(user.last_login_at).toLocaleDateString(
                          "es-PE",
                          { day: "2-digit", month: "short", year: "2-digit" },
                        )}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <Badge className="rounded-none bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider">
                        Activo
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="rounded-none text-[9px] font-bold uppercase tracking-wider opacity-70"
                      >
                        Inactivo
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs rounded-none hover:bg-primary/10 hover:text-primary"
                        onClick={() => setGrantTarget(user)}
                        title="Ajustar créditos"
                      >
                        <Coins className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 px-2 text-xs rounded-none ${user.is_active ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-emerald-500/10 hover:text-emerald-500"}`}
                        onClick={() =>
                          toggleMutation.mutate({
                            userId: user.id,
                            is_active: !user.is_active,
                          })
                        }
                        disabled={toggleMutation.isPending}
                        title={
                          user.is_active
                            ? "Desactivar usuario"
                            : "Activar usuario"
                        }
                      >
                        {user.is_active ? (
                          <ToggleRight className="h-3.5 w-3.5" />
                        ) : (
                          <ToggleLeft className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Keys Tab ─────────────────────────────────────────────────────────────────

const MODEL_PLACEHOLDER: Record<string, string> = {
  OPENAI: "gpt-4o-mini",
  GEMINI: "gemini/gemini-2.0-flash",
  GROQ: "groq/llama-3.3-70b-versatile",
  NVIDIA: "nvidia_nim/meta/llama-3.1-70b-instruct",
  ANTHROPIC: "claude-haiku-4-5-20251001",
  OPENROUTER: "openrouter/mistralai/mistral-7b-instruct",
  OTHER: "prefix/model-name",
};

function KeysTab({
  keys,
  isLoading,
  queryClient,
}: {
  keys: SystemAiKey[];
  isLoading: boolean;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const [newKey, setNewKey] = useState({
    provider: "GEMINI",
    api_key: "",
    priority: 1,
    label: "",
    default_model: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [verifyResult, setVerifyResult] = useState<
    Record<string, { ok: boolean; message: string } | null>
  >({});

  const addKeyMutation = useMutation({
    mutationFn: () =>
      createSystemKey(
        newKey.provider,
        newKey.api_key,
        newKey.priority,
        newKey.label || newKey.provider,
        newKey.default_model || null,
      ),
    onSuccess: () => {
      setNewKey({
        provider: "GEMINI",
        api_key: "",
        priority: 1,
        label: "",
        default_model: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "system-keys"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => deleteSystemKey(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "system-keys"] }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateSystemKey(id, { is_active }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "system-keys"] }),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => verifySystemKey(id),
    onSuccess: (data, id) =>
      setVerifyResult((prev) => ({ ...prev, [id]: data })),
  });

  return (
    <div className="space-y-6">
      {/* Existing Keys */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Claves Maestras ({keys.length})
        </p>
        {isLoading && <LoadingState label="Cargando claves..." />}
        {keys.map((k) => (
          <div
            key={k.id}
            className={`border-2 ${k.is_active ? "border-border/60" : "border-border/30 opacity-60"} p-4 flex items-center gap-4`}
          >
            {/* Left stripe */}
            <div
              className={`w-1 self-stretch rounded-sm ${k.is_active ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{k.provider}</span>
                <span className="text-[10px] text-muted-foreground border border-border/60 px-1.5 py-0.5">
                  Prioridad: {k.priority}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {k.label}
                </span>
                {k.key_last_four && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ••••{k.key_last_four}
                  </span>
                )}
              </div>
              {k.default_model && (
                <p className="text-[11px] font-mono text-primary mt-0.5 truncate">
                  {k.default_model}
                </p>
              )}
              {verifyResult[k.id] && (
                <p
                  className={`text-[10px] mt-1 flex items-center gap-1 ${verifyResult[k.id]?.ok ? "text-emerald-500" : "text-destructive"}`}
                >
                  {verifyResult[k.id]?.ok ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {verifyResult[k.id]?.message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 rounded-none text-xs"
                onClick={() => verifyMutation.mutate(k.id)}
                disabled={verifyMutation.isPending}
                title="Verificar"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${verifyMutation.isPending ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 rounded-none text-xs ${k.is_active ? "hover:text-amber-500" : "hover:text-emerald-500"}`}
                onClick={() =>
                  toggleActiveMutation.mutate({
                    id: k.id,
                    is_active: !k.is_active,
                  })
                }
                title={k.is_active ? "Desactivar" : "Activar"}
              >
                {k.is_active ? (
                  <ZapOff className="h-3.5 w-3.5" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 rounded-none text-xs hover:text-destructive"
                onClick={() => deleteKeyMutation.mutate(k.id)}
                title="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {keys.length === 0 && !isLoading && (
          <div className="border-2 border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
            Sin claves maestras. Agrega una para habilitar el sistema de
            créditos.
          </div>
        )}
      </div>

      {/* Add New Key */}
      <div className="border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" /> Nueva Clave Maestra
        </p>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select
            className="h-9 border-2 border-input bg-background px-3 text-sm font-mono rounded-none"
            value={newKey.provider}
            onChange={(e) =>
              setNewKey({
                ...newKey,
                provider: e.target.value,
                default_model: "",
              })
            }
          >
            {Object.keys(MODEL_PLACEHOLDER).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Prioridad"
            value={newKey.priority}
            onChange={(e) =>
              setNewKey({ ...newKey, priority: Number(e.target.value) })
            }
            className="w-24 rounded-none border-2 font-mono text-sm h-9"
          />
        </div>
        <Input
          placeholder="Etiqueta (ej: Gemini Free Tier)"
          value={newKey.label}
          onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
          className="rounded-none border-2 font-mono text-xs h-9"
        />
        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            placeholder="API Key (sk-...)"
            value={newKey.api_key}
            onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })}
            className="rounded-none border-2 font-mono text-xs h-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showKey ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        {(providerModels as any)[newKey.provider]?.length > 0 ? (
          <select
            value={newKey.default_model}
            onChange={(e) =>
              setNewKey({ ...newKey, default_model: e.target.value })
            }
            className="h-9 w-full border-2 border-input bg-background px-3 text-xs font-mono rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <option value="">-- Modelo por defecto (Opcional) --</option>
            {(providerModels as any)[newKey.provider].map((model: any) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        ) : (
          <Input
            placeholder={
              MODEL_PLACEHOLDER[newKey.provider] ?? "prefix/model-name"
            }
            value={newKey.default_model}
            onChange={(e) =>
              setNewKey({ ...newKey, default_model: e.target.value })
            }
            className="rounded-none border-2 font-mono text-xs h-9"
          />
        )}
        {addKeyMutation.isError && (
          <p className="text-xs text-destructive">
            {getApiErrorMessage(addKeyMutation.error)}
          </p>
        )}
        <Button
          className="w-full rounded-none h-9"
          disabled={!newKey.api_key || addKeyMutation.isPending}
          onClick={() => addKeyMutation.mutate()}
        >
          {addKeyMutation.isPending ? "Guardando..." : "Guardar Clave Maestra"}
        </Button>
      </div>
    </div>
  );
}



// ─── Config Tab ───────────────────────────────────────────────────────────────

function ConfigTab({
  config,
  isLoading,
  queryClient,
  totalActiveUsers,
  queryClientAdmin,
}: {
  config: SystemConfigEntry[];
  isLoading: boolean;
  queryClient: ReturnType<typeof useQueryClient>;
  totalActiveUsers: number;
  queryClientAdmin: ReturnType<typeof useQueryClient>;
}) {
  // Announcement
  const announcement =
    config.find((c) => c.key === "login_announcement")?.value ?? "";
  const initialCredits =
    config.find((c) => c.key === "default_initial_credits")?.value ?? "5";
  const creditsEnabled =
    config.find((c) => c.key === "system_credits_enabled")?.value ?? "true";
  const g4fEnabled =
    config.find((c) => c.key === "use_g4f_for_system_credits")?.value ?? "true";

  const [announcementDraft, setAnnouncementDraft] = useState(announcement);
  const [initialCreditsDraft, setInitialCreditsDraft] =
    useState(initialCredits);
  const [bulkAmount, setBulkAmount] = useState(10);
  const [bulkDesc, setBulkDesc] = useState("Bono global del administrador");
  const [bulkResult, setBulkResult] = useState<{
    affected_users: number;
  } | null>(null);

  // sync drafts when config loads
  const announcementFromConfig =
    config.find((c) => c.key === "login_announcement")?.value ?? "";
  const initialCreditsFromConfig =
    config.find((c) => c.key === "default_initial_credits")?.value ?? "5";

  const updateConfigMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSystemConfig(key, value),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "config"] }),
  });

  const bulkGrantMutation = useMutation({
    mutationFn: () => bulkGrantCredits(bulkAmount, bulkDesc),
    onSuccess: (data) => {
      setBulkResult(data);
      queryClientAdmin.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClientAdmin.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  if (isLoading) return <LoadingState label="Cargando configuración..." />;

  const isCreditsEnabled = creditsEnabled === "true";
  const isG4fEnabled = g4fEnabled === "true";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* System Credits Toggle */}
      <div className="border-2 border-border/60 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Sistema de Créditos
            </p>
            <p className="text-sm font-semibold mt-0.5">
              {isCreditsEnabled ? "Activo" : "Desactivado"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Si se desactiva, los usuarios no podrán usar créditos del sistema
              para IA.
            </p>
          </div>
          <Button
            variant={isCreditsEnabled ? "danger" : "primary"}
            size="sm"
            className="rounded-none"
            onClick={() =>
              updateConfigMutation.mutate({
                key: "system_credits_enabled",
                value: isCreditsEnabled ? "false" : "true",
              })
            }
            disabled={updateConfigMutation.isPending}
          >
            {isCreditsEnabled ? (
              <>
                <ZapOff className="h-4 w-4 mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Activar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* G4F Toggle */}
      <div className="border-2 border-border/60 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Bot className="h-3.5 w-3.5" /> IA Gratuita (G4F)
            </p>
            <p className="text-sm font-semibold mt-0.5">
              {isG4fEnabled
                ? "Usando GPT4Free"
                : "Usando System Keys"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isG4fEnabled
                ? "El sistema buscará automáticamente servidores gratuitos en internet. (No requiere configuración, pero puede ser inestable)."
                : "Los créditos consumirán las System Keys (API tradicional) configuradas en la otra pestaña."}
            </p>
          </div>
          <Button
            variant={isG4fEnabled ? "danger" : "primary"}
            size="sm"
            className="rounded-none"
            onClick={() =>
              updateConfigMutation.mutate({
                key: "use_g4f_for_system_credits",
                value: isG4fEnabled ? "false" : "true",
              })
            }
            disabled={updateConfigMutation.isPending}
          >
            {isG4fEnabled ? (
              <>
                <ZapOff className="h-4 w-4 mr-2" />
                Desactivar
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Activar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Default Initial Credits */}
      <div className="border-2 border-border/60 p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Créditos Iniciales por Defecto
        </p>
        <p className="text-xs text-muted-foreground">
          Créditos que recibe cada nuevo usuario al registrarse.
        </p>
        <div className="flex gap-2">
          <Input
            type="number"
            value={initialCreditsDraft}
            onChange={(e) => setInitialCreditsDraft(e.target.value)}
            className="rounded-none border-2 font-mono text-sm h-9 w-32"
            min={0}
          />
          <Button
            size="sm"
            className="rounded-none h-9"
            onClick={() =>
              updateConfigMutation.mutate({
                key: "default_initial_credits",
                value: initialCreditsDraft,
              })
            }
            disabled={
              updateConfigMutation.isPending ||
              initialCreditsDraft === initialCreditsFromConfig
            }
          >
            Guardar
          </Button>
        </div>
      </div>

      {/* Bulk Grant Credits */}
      <div className="border-2 border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
          <Coins className="h-3.5 w-3.5" />
          Otorgar Créditos a Todos los Usuarios Activos ({totalActiveUsers}{" "}
          usuarios)
        </p>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Cantidad"
            value={bulkAmount}
            onChange={(e) => setBulkAmount(Number(e.target.value))}
            className="rounded-none border-2 font-mono text-sm h-9 w-28"
            min={1}
          />
          <Input
            placeholder="Descripción"
            value={bulkDesc}
            onChange={(e) => setBulkDesc(e.target.value)}
            className="rounded-none border-2 font-mono text-xs h-9 flex-1"
          />
        </div>
        {bulkResult && (
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            {bulkResult.affected_users} usuarios recibieron {bulkAmount}{" "}
            créditos cada uno.
          </p>
        )}
        <Button
          className="rounded-none h-9"
          variant="secondary"
          onClick={() => {
            setBulkResult(null);
            bulkGrantMutation.mutate();
          }}
          disabled={bulkGrantMutation.isPending || bulkAmount <= 0}
        >
          {bulkGrantMutation.isPending
            ? "Procesando..."
            : `Otorgar ${bulkAmount} créditos a todos`}
        </Button>
      </div>

      {/* Announcement */}
      <div className="border-2 border-border/60 p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          Anuncio del Sistema
        </p>
        <p className="text-xs text-muted-foreground">
          Mensaje que los usuarios verán al iniciar sesión. Déjalo vacío para no
          mostrar ningún anuncio.
        </p>
        <textarea
          value={announcementDraft}
          onChange={(e) => setAnnouncementDraft(e.target.value)}
          placeholder="Ej: ¡Bienvenidos! Estamos en mantenimiento programado el sábado 14/06 de 2am a 4am."
          rows={3}
          className="w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-none h-9"
            onClick={() =>
              updateConfigMutation.mutate({
                key: "login_announcement",
                value: announcementDraft,
              })
            }
            disabled={
              updateConfigMutation.isPending ||
              announcementDraft === announcementFromConfig
            }
          >
            {announcementDraft.trim() ? "Publicar Anuncio" : "Limpiar Anuncio"}
          </Button>
          {updateConfigMutation.isSuccess && (
            <span className="text-xs text-emerald-500 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Guardado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
