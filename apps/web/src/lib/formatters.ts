const enumLabels: Record<string, string> = {
  HEALTHY: "Saludable",
  VIABLE_WITH_ADJUSTMENTS: "Viable con ajustes",
  RISKY: "Riesgoso",
  UNSUSTAINABLE: "Poco sostenible",
  INSUFFICIENT_DATA: "Datos insuficientes",
  CONTINUE: "Continuar",
  IMPROVE: "Mejorar",
  PIVOT: "Pivotar",
  PAUSE: "Pausar",
  DISCARD: "Descartar",
  BASIC: "Básico",
  EXECUTIVE: "Ejecutivo",
  GENERATED: "Generado",
  FAILED: "Fallido",
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  ARCHIVED: "Archivada",
  DELETED: "Eliminada",
  IDEA: "Idea",
  PLANNING: "Planificación",
  MVP: "MVP",
  LAUNCHED: "Lanzado",
  GROWING: "En crecimiento",
  PAUSED: "Pausado",
  EDTECH: "EdTech",
  FINTECH: "FinTech",
  HEALTHTECH: "HealthTech",
  PRODUCTIVITY: "Productividad",
  MARKETING: "Marketing",
  ECOMMERCE: "Ecommerce",
  AI: "IA",
  DEVELOPER_TOOLS: "Herramientas para desarrolladores",
  OTHER: "Otro",
  FREEMIUM: "Freemium",
  SUBSCRIPTION: "Suscripción",
  ONE_TIME: "Pago único",
};

export function formatNullable(value?: unknown): string {
  if (value === null || value === undefined || value === "") return "Sin dato";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "Sin dato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin dato";
  return date.toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value?: string | null): string {
  if (!value) return "Sin dato";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin dato";
  return date.toLocaleDateString("es-PE", {
    dateStyle: "medium",
  });
}

export function formatNumber(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "Sin dato";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(numeric);
}

export function formatCurrency(value?: string | number | null, currency?: string | null): string {
  if (value === null || value === undefined || value === "") return "Sin precio";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return `${value} ${currency || ""}`.trim();
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatPercent(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "Sin dato";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return `${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(numeric)}%`;
}

export function formatEnum(value?: string | null): string {
  if (!value) return "Sin definir";
  if (enumLabels[value]) return enumLabels[value];
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
