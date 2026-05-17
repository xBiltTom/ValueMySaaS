import { z } from "zod";
import { aiProviders } from "@/features/ai-keys/constants";

export const aiKeySchema = z.object({
  provider: z.enum(aiProviders),
  label: z.string().min(2, "Usa al menos 2 caracteres.").max(100),
  api_key: z.string().min(8, "La API Key debe tener al menos 8 caracteres."),
});

export const verifyAiKeySchema = z.object({
  model_name: z.string().max(100).optional().or(z.literal("")),
});

export type AiKeyFormValues = z.infer<typeof aiKeySchema>;
export type VerifyAiKeyFormValues = z.infer<typeof verifyAiKeySchema>;
