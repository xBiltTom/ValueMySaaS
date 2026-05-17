import { formatDateTime, formatNullable } from "@/lib/formatters";

const keyLabels: Record<string, string> = {
  executive_summary: "Resumen ejecutivo",
  main_findings: "Hallazgos principales",
  recommendations: "Recomendaciones",
  alerts: "Alertas",
  metrics: "Métricas",
  metric_cards: "Métricas clave",
  score: "Score",
  latest_score: "Último score",
  latest_snapshot: "Último snapshot",
  sustainability_level: "Nivel de sostenibilidad",
  decision_recommendation: "Recomendación de decisión",
  generated_at: "Fecha de generación",
  service_value_assessment: "Evaluacion del valor del servicio",
  data_quality: "Calidad de datos",
  has_snapshot: "Tiene snapshot",
  has_score: "Tiene score",
  notes: "Notas",
  project: "Proyecto",
  series: "Series historicas",
};

export function humanizeKey(key: string) {
  if (keyLabels[key]) return keyLabels[key];
  return key
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function displayValue(value: unknown) {
  if (value === null || value === undefined) return formatNullable(value);
  if (typeof value === "boolean") return formatNullable(value);
  if (typeof value === "number") return new Intl.NumberFormat("es-PE").format(value);
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return formatDateTime(value);
    }
    return value;
  }
  return String(value);
}

export function reportTypeLabel(type: string) {
  if (type === "BASIC") return "Básico";
  if (type === "EXECUTIVE") return "Ejecutivo";
  return humanizeKey(type);
}
