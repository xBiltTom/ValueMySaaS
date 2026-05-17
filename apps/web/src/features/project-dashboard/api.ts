"use client";

import { apiClient } from "@/lib/api-client";
import { ProjectDashboardResponse, SaasProject } from "@/features/project-dashboard/types";

export async function getProject(projectId: string) {
  const { data } = await apiClient.get<SaasProject>(`/saas-projects/${projectId}`);
  return data;
}

export async function getProjectDashboard(projectId: string) {
  const { data } = await apiClient.get<ProjectDashboardResponse>(`/saas-projects/${projectId}/dashboard`);
  return data;
}
