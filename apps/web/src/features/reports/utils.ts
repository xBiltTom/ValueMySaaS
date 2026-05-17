const keyLabels: Record<string, string> = {
  executive_summary: "Resumen ejecutivo",
  main_findings: "Hallazgos principales",
  recommendations: "Recomendaciones",
  alerts: "Alertas",
  metrics: "Metricas",
  metric_cards: "Metricas clave",
  score: "Score",
  latest_score: "Ultimo score",
  latest_snapshot: "Ultimo snapshot",
  sustainability_level: "Nivel de sostenibilidad",
  decision_recommendation: "Recomendacion de decision",
  generated_at: "Fecha de generacion",
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
  if (value === null || value === undefined) return "Sin dato";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "number") return new Intl.NumberFormat("es-PE").format(value);
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleString("es-PE");
    }
    return value;
  }
  return String(value);
}

export function reportTypeLabel(type: string) {
  if (type === "BASIC") return "Basico";
  if (type === "EXECUTIVE") return "Ejecutivo";
  return humanizeKey(type);
}
