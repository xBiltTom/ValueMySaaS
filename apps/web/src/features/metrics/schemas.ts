import { z } from "zod";

const optionalMoneyOrRate = z.number().min(0, "Debe ser 0 o mayor.").optional();
const optionalCount = z
  .number()
  .int("Debe ser un numero entero.")
  .min(0, "Debe ser 0 o mayor.")
  .optional();

export const metricSnapshotSchema = z.object({
  period_label: z.string().optional(),
  captured_at: z.string().min(1, "Debes seleccionar un mes para registrar el snapshot."),
  mrr: optionalMoneyOrRate,
  monthly_revenue: optionalMoneyOrRate,
  monthly_costs: optionalMoneyOrRate,
  cash_available: optionalMoneyOrRate,
  marketing_spend: optionalMoneyOrRate,
  total_users: optionalCount,
  active_users: optionalCount,
  paying_customers: optionalCount,
  new_users: optionalCount,
  new_paying_customers: optionalCount,
  churned_customers: optionalCount,
  nps: z.number().min(-100).max(100).optional(),
  support_tickets: optionalCount,
  critical_bugs: optionalCount,
  uptime_percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  custom_metrics: z.any().optional(),
});

export type MetricSnapshotFormValues = z.infer<typeof metricSnapshotSchema>;
