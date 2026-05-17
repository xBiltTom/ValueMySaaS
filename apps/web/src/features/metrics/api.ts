"use client";

import { apiClient } from "@/lib/api-client";
import {
  CreateMetricSnapshotPayload,
  MetricCalculationResponse,
  MetricSnapshot,
  MetricSnapshotListResponse,
} from "@/features/metrics/types";

export async function listMetricSnapshots(projectId: string) {
  const { data } = await apiClient.get<MetricSnapshotListResponse>(
    `/saas-projects/${projectId}/metric-snapshots`,
  );
  return data;
}

export async function createMetricSnapshot(projectId: string, payload: CreateMetricSnapshotPayload) {
  const { data } = await apiClient.post<MetricSnapshot>(
    `/saas-projects/${projectId}/metric-snapshots`,
    payload,
  );
  return data;
}

export async function getLatestMetricCalculation(projectId: string) {
  const { data } = await apiClient.get<MetricCalculationResponse>(
    `/saas-projects/${projectId}/metric-calculations/latest`,
  );
  return data;
}
