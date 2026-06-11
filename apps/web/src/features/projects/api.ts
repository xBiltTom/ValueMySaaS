"use client";

import { apiClient } from "@/lib/api-client";
import { CreateSaasProjectPayload, SaasProject, SaasProjectListResponse } from "@/features/projects/types";

export async function listProjects() {
  const { data } = await apiClient.get<SaasProjectListResponse>("/saas-projects");
  return data;
}

export async function createProject(payload: CreateSaasProjectPayload) {
  const { data } = await apiClient.post<SaasProject>("/saas-projects", payload);
  return data;
}

export async function updateProject(projectId: string, payload: Partial<CreateSaasProjectPayload>) {
  const { data } = await apiClient.patch<SaasProject>(`/saas-projects/${projectId}`, payload);
  return data;
}
