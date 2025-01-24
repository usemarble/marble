import { z } from "zod";

// auth form
export const credentialSchema = z.object({
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
export type CredentialData = z.infer<typeof credentialSchema>;

export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"], {
    message: "Please select a role",
  }),
});
export type InviteData = z.infer<typeof inviteSchema>;
