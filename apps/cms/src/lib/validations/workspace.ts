import { z } from "zod";
import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  timezones,
} from "@/lib/constants";

// Tag Schema
export const tagSchema = z.object({
  name: z.string().trim().min(1, { message: "Name cannot be empty" }),
  slug: z.string().trim().min(1, { message: "Slug cannot be empty" }),
  description: z.string().trim().optional(),
});
export type CreateTagValues = z.infer<typeof tagSchema>;

// Category Schema
export const categorySchema = z.object({
  name: z.string().trim().min(1, { message: "Name cannot be empty" }),
  slug: z.string().trim().min(1, { message: "Slug cannot be empty" }),
  description: z.string().trim().optional(),
});
export type CreateCategoryValues = z.infer<typeof categorySchema>;

// Workspace Creation Schema
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

// Workspace Timezone Update Schema
export const timezoneSchema = z.object({
  timezone: z.enum(timezones as [string, ...string[]]),
});
export type TimezoneValues = z.infer<typeof timezoneSchema>;

// Social Link Schema
const socialLinkSchema = z.object({
  id: z.string().optional().nullable(),
  url: z.string().url({ message: "Please enter a valid URL" }),
  platform: z.enum(
    Object.keys(SOCIAL_PLATFORMS) as [SocialPlatform, ...SocialPlatform[]]
  ),
});

// Author Schema
export const authorSchema = z.object({
  name: z.string().trim().min(1, { message: "Name cannot be empty" }),
  role: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  bio: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  image: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .min(4, { message: "Slug cannot be empty" })
    .max(32, { message: "Slug cannot be more than 32 characters" })
    .regex(/^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$/, {
      message:
        "Slug must start and end with letters or digits, and only contain lowercase letters, digits, and hyphens",
    }),
  socials: z.array(socialLinkSchema).optional(),
});
export type CreateAuthorValues = z.infer<typeof authorSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
