import { analysisLabels } from "@/features/ai-analyses/constants";
import { AiAnalysis, AiAnalysisType } from "@/features/ai-analyses/types";

export function analysisTypeLabel(type: AiAnalysisType) {
  return analysisLabels[type] || type;
}

export function getAnalysisText(analysis: AiAnalysis) {
  if (!analysis.output_text) return null;
  let text = analysis.output_text.replace(/```json[\s\S]*/i, "");
  text = text.replace(/\{\s*"problem_clarity_score"[\s\S]*/i, "");
  return text.trim() || null;
}
