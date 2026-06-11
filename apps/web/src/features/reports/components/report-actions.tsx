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
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bento-card overflow-hidden border-border bg-card">
        <CardHeader className="p-6 md:p-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">Reporte Básico</CardTitle>
          <CardDescription className="mt-2 text-base leading-relaxed">
            Resume el diagnóstico general, con métricas clave, alertas y recomendaciones para entender el estado del producto.
          </CardDescription>
          <Button 
            className="btn-premium mt-6 w-full sm:w-auto px-8" 
            onClick={onBasic} 
            disabled={isBasicLoading}
          >
            {isBasicLoading ? "Generando..." : "Generar Reporte Básico"}
          </Button>
        </CardHeader>
      </Card>
      
      <Card className="bento-card overflow-hidden border-border bg-card relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <CardHeader className="p-6 md:p-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Presentation className="h-6 w-6 text-accent" />
          </div>
          <CardTitle className="font-display text-2xl font-bold">Reporte Ejecutivo</CardTitle>
          <CardDescription className="mt-2 text-base leading-relaxed">
            Convierte el diagnóstico en evidencia estructurada para decisiones directivas, defensa de proyecto o portafolio.
          </CardDescription>
          <Button 
            className="btn-premium mt-6 w-full sm:w-auto px-8 border border-border hover:border-primary bg-background hover:bg-muted text-foreground" 
            onClick={onExecutive} 
            disabled={isExecutiveLoading}
          >
            {isExecutiveLoading ? "Generando..." : "Generar Reporte Ejecutivo"}
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
