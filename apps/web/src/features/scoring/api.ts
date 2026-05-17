"use client";

import { apiClient } from "@/lib/api-client";
import { SaasScore, SaasScoreListResponse } from "@/features/scoring/types";

export async function getLatestScore(projectId: string) {
  const { data } = await apiClient.get<SaasScore>(`/saas-projects/${projectId}/scores/latest`);
  return data;
}

export async function listScores(projectId: string) {
  const { data } = await apiClient.get<SaasScoreListResponse>(`/saas-projects/${projectId}/scores`);
  return data;
}

export async function generateLatestScore(projectId: string) {
  const { data } = await apiClient.post<SaasScore>(`/saas-projects/${projectId}/scores/latest`);
  return data;
}
