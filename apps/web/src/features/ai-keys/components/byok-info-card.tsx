import { KeyRound, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ByokInfoCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle>Modelo BYOK</CardTitle>
        <CardDescription>
          Conecta tu propia API Key para habilitar analisis avanzados sin trasladar costos de IA a la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 rounded-md border border-primary/15 bg-primary/10 p-4 text-sm leading-6 text-primary">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            La clave se envia al backend para cifrado y nunca se vuelve a mostrar completa. En esta pantalla solo veras
            proveedor, etiqueta, estado y los ultimos 4 caracteres.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
