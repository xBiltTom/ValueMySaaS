import { z } from "zod";

export const categories = [
  "EDTECH",
  "FINTECH",
  "HEALTHTECH",
  "PRODUCTIVITY",
  "MARKETING",
  "ECOMMERCE",
  "AI",
  "DEVELOPER_TOOLS",
  "OTHER",
] as const;

export const stages = ["IDEA", "PLANNING", "MVP", "LAUNCHED", "GROWING", "PAUSED"] as const;

export const businessModels = ["B2B", "B2C", "B2B2C", "FREEMIUM", "SUBSCRIPTION", "ONE_TIME", "OTHER"] as const;

export const createProjectSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  description: z.string().optional(),
  category: z.enum(categories),
  stage: z.enum(stages),
  business_model: z.enum(businessModels),
  target_market: z.string().min(2, "Define el mercado objetivo."),
  target_audience: z.string().min(2, "Define la audiencia objetivo."),
  main_problem: z.string().min(8, "Describe el problema principal."),
  value_proposition: z.string().min(8, "Describe la propuesta de valor."),
  competitors: z.string().optional(),
  acquisition_strategy: z.string().optional(),
  pricing_notes: z.string().optional(),
  current_price: z.number().min(0, "El precio no puede ser negativo.").optional(),
  currency: z.string().min(3).max(10),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
