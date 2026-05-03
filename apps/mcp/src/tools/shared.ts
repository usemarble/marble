import { z } from "zod";

export const readOnlyAnnotations = {
  readOnlyHint: true,
} as const;

export const destructiveAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
} as const;

export const paginationInput = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Number of items per page. Defaults to the Marble API default."),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Page number. Defaults to page 1."),
};

export const identifierInput = {
  identifier: z.string().min(1).describe("Resource ID or slug."),
};

export const namedResourceBody = {
  name: z.string().min(1).describe("Display name."),
  slug: z.string().min(1).describe("URL-friendly slug."),
  description: z.string().optional().describe("Optional description."),
};

export const updateNamedResourceBody = {
  name: z.string().min(1).optional().describe("Updated display name."),
  slug: z.string().min(1).optional().describe("Updated URL-friendly slug."),
  description: z
    .string()
    .nullable()
    .optional()
    .describe("Updated description. Use null to clear it."),
};
