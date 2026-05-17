import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un correo valido."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
});

export const registerSchema = loginSchema.extend({
  username: z.string().min(3, "Minimo 3 caracteres.").optional().or(z.literal("")),
  full_name: z.string().max(255).optional().or(z.literal("")),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
