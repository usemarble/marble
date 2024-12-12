import { z } from "zod";

// auth form
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Invalid email"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});
export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema.extend({
  name: z.string({ required_error: "Please enter a name" }),
});
export type RegisterData = z.infer<typeof registerSchema>;
