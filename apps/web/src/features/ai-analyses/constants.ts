import { AiAnalysisType } from "@/features/ai-analyses/types";

export const analysisTypes: AiAnalysisType[] = [
  "EXECUTIVE_SUMMARY",
  "RISK_ANALYSIS",
  "PRICING_ANALYSIS",
  "GROWTH_ANALYSIS",
  "RETENTION_ANALYSIS",
  "FULL_DIAGNOSIS",
  "CUSTOM",
];

export const analysisLabels: Record<AiAnalysisType, string> = {
  EXECUTIVE_SUMMARY: "Resumen ejecutivo",
  RISK_ANALYSIS: "Análisis de riesgos",
  PRICING_ANALYSIS: "Análisis de pricing",
  GROWTH_ANALYSIS: "Análisis de crecimiento",
  RETENTION_ANALYSIS: "Análisis de retención",
  FULL_DIAGNOSIS: "Diagnóstico completo",
  CUSTOM: "Pregunta personalizada",
};

export const analysisDescriptions: Record<AiAnalysisType, string> = {
  EXECUTIVE_SUMMARY: "Resume el estado del SaaS para toma de decisiones.",
  RISK_ANALYSIS: "Identifica riesgos operativos, financieros y de crecimiento.",
  PRICING_ANALYSIS: "Revisa precio, modelo de negocio y senales de monetizacion.",
  GROWTH_ANALYSIS: "Analiza adquisición, usuarios, crecimiento y tracción.",
  RETENTION_ANALYSIS: "Evalúa churn, retención, NPS y señales de satisfacción.",
  FULL_DIAGNOSIS: "Genera una evaluacion amplia del SaaS.",
  CUSTOM: "Permite hacer una pregunta especifica usando el contexto del SaaS.",
};
