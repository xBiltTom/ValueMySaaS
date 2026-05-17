"use client";

import { apiClient } from "@/lib/api-client";
import { PortfolioDashboardResponse } from "@/features/dashboard/types";

export async function getPortfolioDashboard() {
  const { data } = await apiClient.get<PortfolioDashboardResponse>("/dashboard/portfolio");
  return data;
}
