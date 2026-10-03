import { z } from "zod";

/**
 * Reserved workspace slugs that cannot be used for workspace creation
 * to prevent conflicts with system routes and Next.js internals
 */
export const RESERVED_WORKSPACE_SLUGS = [
  // Auth routes
  "login",
  "register",
  "reset",
  "verify",
  "join",
  "invite",
  "auth",
  // System routes
  "api",
  "new",
  "share",
  "settings",
  // API routes
  "account",
  "accounts",
  "ai",
  "billing",
  "complete",
  "import",
  "metrics",
  "polar",
  "preferences",
  "publishing",
  "suggestions",
  "upload",
  "usage",
  "user",
  "workspace",
  "workspaces",
  "success",
  // Workspace-level pages (dashboard routes)
  "posts",
  "post",
  "categories",
  "category",
  "tags",
  "tag",
  "authors",
  "author",
  "media",
  "webhooks",
  "webhook",
  "hooks",
  "hook",
  "keys",
  "key",
  "editor",
  // Next.js internals
  "_next",
  "static",
  "favicon",
  "robots",
  "sitemap",
  // Future-proofing common patterns
  "admin",
  "dashboard",
  "app",
  "www",
  "blog",
  "docs",
  "help",
  "support",
  "about",
  "contact",
  "pricing",
  "terms",
  "privacy",
] as const;

export const timezones = Intl.supportedValuesOf("timeZone");

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
