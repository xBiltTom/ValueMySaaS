import { MessageSquareText } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ChatContextCard() {
  return (
    <Card>
      <CardHeader>
        <MessageSquareText className="h-6 w-6 text-primary" />
        <CardTitle>Chat contextual del SaaS</CardTitle>
        <CardDescription>
          Conversa sobre métricas, score, alertas, reportes y análisis registrados. No es un asistente genérico:
          interpreta el contexto del SaaS seleccionado y apoya la mejora continua.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
