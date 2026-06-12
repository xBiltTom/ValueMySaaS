"use client";

import { apiClient } from "@/lib/api-client";
import { SaasReport, SaasReportListResponse } from "@/features/reports/types";

export async function generateReport(projectId: string) {
  const { data } = await apiClient.post<SaasReport>(`/saas-projects/${projectId}/reports/generate`);
  return data;
}

export async function listReports(projectId: string) {
  const { data } = await apiClient.get<SaasReportListResponse>(`/saas-projects/${projectId}/reports`);
  return data;
}

export async function getReport(projectId: string, reportId: string) {
  const { data } = await apiClient.get<SaasReport>(`/saas-projects/${projectId}/reports/${reportId}`);
  return data;
}

export async function deleteReport(projectId: string, reportId: string) {
  await apiClient.delete(`/saas-projects/${projectId}/reports/${reportId}`);
}
