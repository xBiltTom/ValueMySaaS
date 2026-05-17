import { ConversationMessageRole } from "@/types/api";

export const suggestedQuestions = [
  "Que deberia mejorar primero?",
  "Por que mi SaaS esta en riesgo?",
  "Como puedo reducir churn?",
  "Que metricas faltan para un diagnostico mas confiable?",
  "Como interpreto mi score?",
  "Que acciones priorizarias para mejorar sostenibilidad?",
];

export function roleLabel(role: ConversationMessageRole) {
  if (role === "USER") return "Tu";
  if (role === "ASSISTANT") return "Asistente ValueMySaaS";
  if (role === "SYSTEM") return "Sistema";
  return "Herramienta";
}
