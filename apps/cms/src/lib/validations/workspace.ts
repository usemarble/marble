import { z } from "zod";
import { timezones } from "@/lib/constants";

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
    .max(32, { message: "Slug cannot be more than 32 characters" })
    .regex(/^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/, {
      message:
        "Slug must start and end with letters or digits, and only contain lowercase letters, digits, and hyphens",
    }),
  timezone: z
    .enum(timezones as [string, ...string[]], {
      errorMap: () => ({ message: "Please select a valid timezone" }),
    })
    .optional(),
});
export type CreateWorkspaceValues = z.infer<typeof workspaceSchema>;

export const nameSchema = z.object({
  name: z.string().min(1),
});
export type NameValues = z.infer<typeof nameSchema>;

export const slugSchema = z.object({
  slug: z
    .string()
    .min(4, { message: "Slug cannot be empty" })
    .max(32, { message: "Slug cannot be more than 32 characters" })
    .regex(/^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/, {
      message:
        "Slug must start and end with letters or digits, and only contain lowercase letters, digits, and hyphens",
    }),
});
export type SlugValues = z.infer<typeof slugSchema>;

export const timezoneSchema = z.object({
  timezone: z.enum(timezones as [string, ...string[]]),
});
export type TimezoneValues = z.infer<typeof timezoneSchema>;
