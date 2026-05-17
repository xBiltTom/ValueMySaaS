import { ConversationMessageRole } from "@/types/api";

export const suggestedQuestions = [
  "¿Qué debería mejorar primero?",
  "¿Por qué mi SaaS está en riesgo?",
  "¿Cómo puedo reducir churn?",
  "¿Qué métricas faltan para un diagnóstico más confiable?",
  "¿Cómo interpreto mi score?",
  "¿Qué acciones priorizarías para mejorar sostenibilidad?",
];

export function roleLabel(role: ConversationMessageRole) {
  if (role === "USER") return "Tu";
  if (role === "ASSISTANT") return "Asistente ValueMySaaS";
  if (role === "SYSTEM") return "Sistema";
  return "Herramienta";
}
