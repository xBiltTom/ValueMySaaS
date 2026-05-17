import { KeyRound } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AiKeysPage() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Configuracion</p>
        <h1 className="mt-1 font-display text-4xl font-semibold">IA BYOK</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-muted text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Configuracion BYOK</CardTitle>
          <CardDescription>
            La configuracion BYOK se conectara en la siguiente fase. No hay API keys falsas ni datos simulados en esta pantalla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md border border-dashed border-border bg-white p-4 text-sm leading-6 text-muted-foreground">
            Cuando se active, esta seccion usara los endpoints reales de claves de IA para verificar proveedor,
            estado y seguridad de las credenciales del usuario.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
