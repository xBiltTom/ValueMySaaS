"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, FolderOpen, LogIn, Shield, Users, KeyRound, Database, RefreshCw, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { getAdminStats, getAdminUsers, getSystemKeys, createSystemKey, deleteSystemKey, grantCredits } from "@/features/admin/api";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { getApiErrorMessage } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminPanel() {
  const queryClient = useQueryClient();
  const MODEL_PLACEHOLDER: Record<string, string> = {
    OPENAI: "gpt-4o-mini",
    GEMINI: "gemini/gemini-1.5-flash",
    GROQ: "groq/llama-3.3-70b-versatile",
    NVIDIA: "nvidia_nim/meta/llama-3.1-70b-instruct",
    ANTHROPIC: "claude-haiku-4-5-20251001",
    OPENROUTER: "openrouter/mistralai/mistral-7b-instruct",
    OTHER: "prefix/model-name",
  };

  const [newKey, setNewKey] = useState({ provider: "OPENAI", api_key: "", priority: 1, label: "", default_model: "" });
  const [grant, setGrant] = useState({ userId: "", amount: 10, description: "Bono administrador" });

  const statsQuery = useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats });
  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: getAdminUsers });
  const keysQuery = useQuery({ queryKey: ["admin", "system-keys"], queryFn: getSystemKeys });

  const addKeyMutation = useMutation({
    mutationFn: () => createSystemKey(
      newKey.provider, newKey.api_key, newKey.priority, newKey.label, newKey.default_model || null
    ),
    onSuccess: () => {
      setNewKey({ provider: "OPENAI", api_key: "", priority: 1, label: "", default_model: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "system-keys"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => deleteSystemKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "system-keys"] }),
  });

  const grantMutation = useMutation({
    mutationFn: () => grantCredits(grant.userId, grant.amount, grant.description),
    onSuccess: () => {
      setGrant({ userId: "", amount: 10, description: "Bono administrador" });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      alert("Créditos otorgados con éxito.");
    },
  });

  if (statsQuery.isLoading || usersQuery.isLoading || keysQuery.isLoading) {
    return <LoadingState label="Cargando panel de administración..." />;
  }

  if (statsQuery.isError) return <ErrorState message={getApiErrorMessage(statsQuery.error)} />;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Usuarios Activos</h3>
            </div>
            <p className="mt-4 font-display text-4xl font-bold">{statsQuery.data?.total_users}</p>
          </CardContent>
        </Card>
        <Card className="glass shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-accent" />
              <h3 className="font-semibold text-sm">Proyectos</h3>
            </div>
            <p className="mt-4 font-display text-4xl font-bold">{statsQuery.data?.total_projects}</p>
          </CardContent>
        </Card>
        <Card className="glass shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-status-success-text" />
              <h3 className="font-semibold text-sm">System Keys</h3>
            </div>
            <p className="mt-4 font-display text-4xl font-bold">{statsQuery.data?.system_keys_count}</p>
          </CardContent>
        </Card>
        <Card className="glass shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-sm">Tokens Hoy</h3>
            </div>
            <p className="mt-4 font-display text-2xl font-bold truncate">
              {statsQuery.data?.tokens_output_today.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Users List */}
        <Card className="glass shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5" /> Estudiantes Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Email</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Proyectos</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Créditos</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Último acceso</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Última IA</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersQuery.data?.items.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[200px]">{user.email}</div>
                        {user.username && (
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <FolderOpen className="h-3.5 w-3.5" />
                          {user.project_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-primary">{user.ai_credits}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {user.last_login_at ? (
                          <span className="inline-flex items-center gap-1">
                            <LogIn className="h-3 w-3" />
                            {new Date(user.last_login_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {user.last_ai_activity_at ? (
                          <span className="inline-flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            {new Date(user.last_ai_activity_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="secondary"
                          className="h-8 text-xs"
                          onClick={() => setGrant({ ...grant, userId: user.id })}
                        >
                          Otorgar Créditos
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Tools */}
        <div className="space-y-8">
          {/* Grant Credits Form */}
          <Card className="glass shadow-sm border-primary/20">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <Plus className="h-5 w-5" /> Recarga Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Input 
                placeholder="ID del Usuario" 
                value={grant.userId} 
                onChange={(e) => setGrant({ ...grant, userId: e.target.value })} 
              />
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  type="number" 
                  placeholder="Monto" 
                  value={grant.amount} 
                  onChange={(e) => setGrant({ ...grant, amount: Number(e.target.value) })} 
                />
                <Input 
                  placeholder="Razón" 
                  value={grant.description} 
                  onChange={(e) => setGrant({ ...grant, description: e.target.value })} 
                />
              </div>
              <Button 
                className="w-full" 
                disabled={!grant.userId || grantMutation.isPending}
                onClick={() => grantMutation.mutate()}
              >
                {grantMutation.isPending ? "Procesando..." : "Otorgar Créditos"}
              </Button>
            </CardContent>
          </Card>

          {/* System Keys */}
          <Card className="glass shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" /> System AI Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {keysQuery.data?.items.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{k.provider}</span>
                        {k.is_active ? <span className="h-2 w-2 rounded-full bg-status-success-fg" /> : null}
                        <span className="text-xs text-muted-foreground">#{k.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {k.label}{k.key_last_four ? ` ••••${k.key_last_four}` : ""}
                      </p>
                      {k.default_model && (
                        <p className="text-xs font-mono text-primary/80 mt-0.5 truncate">{k.default_model}</p>
                      )}
                    </div>
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 px-2 h-9 shrink-0" onClick={() => deleteKeyMutation.mutate(k.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {keysQuery.data?.items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay claves maestras registradas.</p>
                )}
              </div>
              <div className="pt-4 border-t border-border space-y-3">
                <p className="text-sm font-semibold">Agregar Clave Maestra</p>
                <div className="grid grid-cols-[1fr_80px] gap-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={newKey.provider}
                    onChange={(e) => setNewKey({ ...newKey, provider: e.target.value, default_model: "" })}
                  >
                    <option value="OPENAI">OpenAI</option>
                    <option value="GEMINI">Gemini (Google AI Studio)</option>
                    <option value="GROQ">Groq</option>
                    <option value="NVIDIA">NVIDIA NIM</option>
                    <option value="ANTHROPIC">Anthropic</option>
                    <option value="OPENROUTER">OpenRouter</option>
                    <option value="OTHER">Otro (prefijo manual)</option>
                  </select>
                  <Input type="number" placeholder="Prio" value={newKey.priority} onChange={(e) => setNewKey({ ...newKey, priority: Number(e.target.value) })} />
                </div>
                <Input
                  placeholder="Etiqueta (ej: Gemini Free Tier)"
                  value={newKey.label}
                  onChange={(e) => setNewKey({ ...newKey, label: e.target.value })}
                />
                <Input placeholder="sk-..." value={newKey.api_key} onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })} />
                <Input
                  placeholder={MODEL_PLACEHOLDER[newKey.provider] ?? "prefix/model-name"}
                  value={newKey.default_model}
                  onChange={(e) => setNewKey({ ...newKey, default_model: e.target.value })}
                />
                <Button className="w-full" variant="secondary" disabled={!newKey.api_key || addKeyMutation.isPending} onClick={() => addKeyMutation.mutate()}>
                  Guardar Clave
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
