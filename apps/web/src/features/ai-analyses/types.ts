import { AiAnalysis, AiAnalysisListResponse, AiAnalysisType } from "@/types/api";

export type CreateAiAnalysisPayload = {
  ai_key_id: string;
  analysis_type: AiAnalysisType;
  model_name?: string | null;
  custom_question?: string | null;
};

export type { AiAnalysis, AiAnalysisListResponse, AiAnalysisType };
