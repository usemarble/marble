import { z } from "zod";

// Get all valid timezone strings from Intl
const timezones = Intl.supportedValuesOf("timeZone");

export const tagSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  slug: z.string().min(1, { message: "Slug cannot be empty" }),
});
export type CreateTagValues = z.infer<typeof tagSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  slug: z.string().min(1, { message: "Slug cannot be empty" }),
});
export type CreateCategoryValues = z.infer<typeof categorySchema>;

export const workspaceSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name cannot be empty" })
    .max(32, { message: "Name cannot be more than 32 characters" }),
  slug: z
    .string()
    .min(4, { message: "Slug cannot be empty" })
    .max(32, { message: "Slug cannot be more than 32 characters" }),
  timezone: z
    .enum(timezones as [string, ...string[]], {
      errorMap: () => ({ message: "Please select a valid timezone" }),
    })
    .optional(),
});
export type CreateWorkspaceValues = z.infer<typeof workspaceSchema>;
