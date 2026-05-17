import { z } from "zod";

const optionalNumber = z.number().min(0, "Debe ser 0 o mayor.").optional();

export const metricSnapshotSchema = z.object({
  period_label: z.string().min(2, "El periodo es obligatorio."),
  captured_at: z.string().optional(),
  mrr: optionalNumber,
  monthly_revenue: optionalNumber,
  monthly_costs: optionalNumber,
  cash_available: optionalNumber,
  marketing_spend: optionalNumber,
  total_users: optionalNumber,
  active_users: optionalNumber,
  paying_customers: optionalNumber,
  new_users: optionalNumber,
  new_paying_customers: optionalNumber,
  churned_customers: optionalNumber,
  nps: z.number().min(-100).max(100).optional(),
  support_tickets: optionalNumber,
  critical_bugs: optionalNumber,
  uptime_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

export type MetricSnapshotFormValues = z.infer<typeof metricSnapshotSchema>;
