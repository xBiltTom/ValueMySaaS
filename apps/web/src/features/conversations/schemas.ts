import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().max(255).optional().or(z.literal("")),
});

export const sendMessageSchema = z.object({
  ai_key_id: z.string().min(1, "Selecciona una API Key activa."),
  model_name: z.string().max(100).optional().or(z.literal("")),
  message: z.string().min(3, "Escribe al menos 3 caracteres.").max(2000, "Maximo 2000 caracteres."),
});

export type CreateConversationFormValues = z.infer<typeof createConversationSchema>;
export type SendMessageFormValues = z.infer<typeof sendMessageSchema>;
