"use client";

import { apiClient } from "@/lib/api-client";
import { AiAnalysis, AiAnalysisListResponse, CreateAiAnalysisPayload } from "@/features/ai-analyses/types";

export async function createAiAnalysis(projectId: string, payload: CreateAiAnalysisPayload) {
  const { data } = await apiClient.post<AiAnalysis>(`/saas-projects/${projectId}/ai-analyses`, payload);
  return data;
}

export async function listAiAnalyses(projectId: string) {
  const { data } = await apiClient.get<AiAnalysisListResponse>(`/saas-projects/${projectId}/ai-analyses`);
  return data;
}

export async function getAiAnalysis(projectId: string, analysisId: string) {
  const { data } = await apiClient.get<AiAnalysis>(
    `/saas-projects/${projectId}/ai-analyses/${analysisId}`,
  );
  return data;
}

export async function deleteAiAnalysis(projectId: string, analysisId: string) {
  await apiClient.delete(`/saas-projects/${projectId}/ai-analyses/${analysisId}`);
}
