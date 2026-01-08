import * as z from "zod";
import { type ApiScope, VALID_SCOPES } from "@/utils/keys";

export const apiKeyTypeEnum = z.enum(["public", "private"]);

export const apiScopeEnum = z.enum(
  VALID_SCOPES as unknown as [ApiScope, ...ApiScope[]]
);

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name cannot be empty" })
    .max(50, { message: "Name cannot be more than 50 characters" }),
  type: apiKeyTypeEnum,
  scopes: z.array(apiScopeEnum).optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type CreateApiKeyValues = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name cannot be empty" })
    .max(50, { message: "Name cannot be more than 50 characters" })
    .optional(),
  scopes: z.array(apiScopeEnum).optional(),
  expiresAt: z.coerce.date().optional().nullable(),
  enabled: z.boolean().optional(),
});

export type UpdateApiKeyValues = z.infer<typeof updateApiKeySchema>;

export type ApiKeyValues = CreateApiKeyValues | UpdateApiKeyValues;
