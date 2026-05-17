"use client";

import { FileText, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportActions({
  onBasic,
  onExecutive,
  isBasicLoading,
  isExecutiveLoading,
}: {
  onBasic: () => void;
  onExecutive: () => void;
  isBasicLoading?: boolean;
  isExecutiveLoading?: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <FileText className="h-6 w-6 text-primary" />
          <CardTitle>Reporte básico</CardTitle>
          <CardDescription>
            Resume snapshot, score, métricas clave, alertas y recomendaciones para revisar el estado actual.
          </CardDescription>
          <Button className="mt-3 w-fit" onClick={onBasic} disabled={isBasicLoading}>
            {isBasicLoading ? "Generando..." : "Generar reporte básico"}
          </Button>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <Presentation className="h-6 w-6 text-primary" />
          <CardTitle>Reporte ejecutivo</CardTitle>
          <CardDescription>
            Convierte el diagnóstico en evidencia visual para decisión, clase, comité o mejora continua.
          </CardDescription>
          <Button className="mt-3 w-fit" variant="secondary" onClick={onExecutive} disabled={isExecutiveLoading}>
            {isExecutiveLoading ? "Generando..." : "Generar reporte ejecutivo"}
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
