import * as z from "zod";
import { RESERVED_WORKSPACE_SLUGS, timezones } from "@/lib/constants";

const workspaceSlugField = z
  .string()
  .min(4, { message: "Slug must be at least 4 characters" })
  .max(32, { message: "Slug cannot be more than 32 characters" })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Slug can only contain lowercase letters, numbers, and single hyphens",
  })
  .refine(
    (slug) => !(RESERVED_WORKSPACE_SLUGS as readonly string[]).includes(slug),
    {
      message: "This slug is not available",
    }
  );

// Tag Schema
export const tagSchema = z.object({
  name: z.string().trim().min(1, { message: "Name cannot be empty" }),
  slug: z.string().slugify().min(1, { message: "Slug cannot be empty" }),
  description: z.string().trim().optional(),
});
export type CreateTagValues = z.infer<typeof tagSchema>;

// Category Schema
export const categorySchema = z.object({
  name: z.string().trim().min(1, { message: "Name cannot be empty" }),
  slug: z.string().slugify().min(1, { message: "Slug cannot be empty" }),
  description: z.string().trim().optional(),
});
export type CreateCategoryValues = z.infer<typeof categorySchema>;

// Workspace Creation Schema
export const workspaceSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name cannot be empty" })
    .max(32, { message: "Name cannot be more than 32 characters" }),
  slug: workspaceSlugField,
  timezone: z
    .enum(timezones as [string, ...string[]], {
      message: "Please select a valid timezone",
    })
    .optional(),
});
export type CreateWorkspaceValues = z.infer<typeof workspaceSchema>;

// Workspace Name Update Schema
export const nameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(32, { message: "Name cannot be more than 32 characters" }),
});
export type NameValues = z.infer<typeof nameSchema>;

// Workspace Slug Update Schema
export const slugSchema = z.object({
  slug: workspaceSlugField,
});
export type SlugValues = z.infer<typeof slugSchema>;

// Workspace Timezone Update Schema
export const timezoneSchema = z.object({
  timezone: z.enum(timezones as [string, ...string[]]),
});
export type TimezoneValues = z.infer<typeof timezoneSchema>;
