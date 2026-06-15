import { MetricCalculationResponse, MetricSnapshot, MetricSnapshotListResponse } from "@/types/api";

export type CreateMetricSnapshotPayload = {
  period_label?: string;
  captured_at?: string;
  mrr?: number;
  monthly_revenue?: number;
  monthly_costs?: number;
  cash_available?: number;
  marketing_spend?: number;
  total_users?: number;
  active_users?: number;
  paying_customers?: number;
  new_users?: number;
  new_paying_customers?: number;
  churned_customers?: number;
  nps?: number;
  support_tickets?: number;
  critical_bugs?: number;
  uptime_percentage?: number;
  notes?: string;
};

export type { MetricCalculationResponse, MetricSnapshot, MetricSnapshotListResponse };
