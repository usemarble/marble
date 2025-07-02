import { z } from "zod";

// auth form
export const credentialSchema = z.object({
  email: z
    .string()
    .email({ message: "Invalid email" })
    .min(1, { message: "Email is required" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(8, { message: "Password must be more than 8 characters" })
    .max(32, { message: "Password must be less than 32 characters" }),
});
export type CredentialData = z.infer<typeof credentialSchema>;

export const inviteSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["admin", "member"], { message: "Please select a role" }),
});
export type InviteData = z.infer<typeof inviteSchema>;
