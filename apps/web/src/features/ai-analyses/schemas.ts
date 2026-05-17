import { z } from "zod";
import { analysisTypes } from "@/features/ai-analyses/constants";

export const aiAnalysisSchema = z
  .object({
    ai_key_id: z.string().min(1, "Selecciona una API Key activa."),
    analysis_type: z.enum(analysisTypes),
    model_name: z.string().max(100).optional().or(z.literal("")),
    custom_question: z.string().max(2000).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.analysis_type === "CUSTOM" && (!value.custom_question || value.custom_question.length < 10)) {
      ctx.addIssue({
        code: "custom",
        path: ["custom_question"],
        message: "Para una pregunta personalizada usa al menos 10 caracteres.",
      });
    }
  });

export type AiAnalysisFormValues = z.infer<typeof aiAnalysisSchema>;
