import { analysisLabels } from "@/features/ai-analyses/constants";
import { AiAnalysis, AiAnalysisType } from "@/features/ai-analyses/types";

export function analysisTypeLabel(type: AiAnalysisType) {
  return analysisLabels[type] || type;
}

export function getAnalysisText(analysis: AiAnalysis) {
  return analysis.output_text || null;
}
