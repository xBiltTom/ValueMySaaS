"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, KeyRound, Database, RefreshCw, Trash2, Plus } from "lucide-react";
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
  const [newKey, setNewKey] = useState({ provider: "OPENAI", api_key: "", priority: 1 });
  const [grant, setGrant] = useState({ userId: "", amount: 10, description: "Bono administrador" });

  const statsQuery = useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats });
  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: getAdminUsers });
  const keysQuery = useQuery({ queryKey: ["admin", "system-keys"], queryFn: getSystemKeys });

  const addKeyMutation = useMutation({
    mutationFn: () => createSystemKey(newKey.provider, newKey.api_key, newKey.priority),
    onSuccess: () => {
      setNewKey({ provider: "OPENAI", api_key: "", priority: 1 });
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
              <KeyRound className="h-5 w-5 text-green-600" />
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
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Email</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Rol</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Créditos</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersQuery.data?.items.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{user.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <Badge className={user.role === "ADMIN" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}>{user.role}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-primary">{user.ai_credits}</td>
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
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-white">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{k.provider}</span>
                        {k.is_active ? <span className="h-2 w-2 rounded-full bg-green-500" /> : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Usos: {k.total_uses} • Prio: {k.priority}</p>
                    </div>
                    <Button variant="ghost" className="text-destructive hover:bg-destructive/10 px-2 h-9" onClick={() => deleteKeyMutation.mutate(k.id)}>
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
                    onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
                  >
                    <option value="OPENAI">OpenAI</option>
                    <option value="GROQ">Groq</option>
                    <option value="GEMINI">Gemini</option>
                    <option value="ANTHROPIC">Anthropic</option>
                  </select>
                  <Input type="number" placeholder="Prio" value={newKey.priority} onChange={(e) => setNewKey({ ...newKey, priority: Number(e.target.value) })} />
                </div>
                <Input placeholder="sk-..." value={newKey.api_key} onChange={(e) => setNewKey({ ...newKey, api_key: e.target.value })} />
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
