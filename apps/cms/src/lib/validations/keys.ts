import { z } from "zod";

export const apiKeyTypeEnum = z.enum(["public", "private"]);

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name cannot be empty" })
    .max(50, { message: "Name cannot be more than 50 characters" }),
  type: apiKeyTypeEnum,
  permissions: z.string().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type CreateApiKeyValues = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name cannot be empty" })
    .max(50, { message: "Name cannot be more than 50 characters" })
    .optional(),
  permissions: z.string().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  enabled: z.boolean().optional(),
});

export type UpdateApiKeyValues = z.infer<typeof updateApiKeySchema>;
