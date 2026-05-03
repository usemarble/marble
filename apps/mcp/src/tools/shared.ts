import { z } from "zod";

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
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
};

export const updateNamedResourceBody = {
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
};
