"use client";

import { apiClient } from "@/lib/api-client";
import { SaasReport, SaasReportListResponse } from "@/features/reports/types";

export async function generateBasicReport(projectId: string) {
  const { data } = await apiClient.post<SaasReport>(`/saas-projects/${projectId}/reports/basic`);
  return data;
}

export async function generateExecutiveReport(projectId: string) {
  const { data } = await apiClient.post<SaasReport>(`/saas-projects/${projectId}/reports/executive`);
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
