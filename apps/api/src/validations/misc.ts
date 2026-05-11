import { z } from "zod";

export const WORKSPACE_EVENT_TYPES = [
  "post_created",
  "post_published",
  "post_updated",
  "post_deleted",
  "category_created",
  "category_updated",
  "category_deleted",
  "tag_created",
  "tag_updated",
  "tag_deleted",
  "media_uploaded",
  "media_updated",
  "media_deleted",
] as const;

export const WORKSPACE_EVENT_SOURCES = [
  "dashboard",
  "api",
  "mcp",
  "workflow",
  "system",
] as const;

export const WORKSPACE_EVENT_ACTOR_TYPES = [
  "user",
  "api_key",
  "mcp",
  "system",
] as const;

export const WORKSPACE_EVENT_RESOURCE_TYPES = [
  "post",
  "category",
  "tag",
  "media",
  "author",
  "workspace",
] as const;

export const InternalEventSchema = z.object({
  type: z.enum(WORKSPACE_EVENT_TYPES),
  workspaceId: z.string().min(1),
  source: z.enum(WORKSPACE_EVENT_SOURCES).optional().default("dashboard"),
  resourceType: z.enum(WORKSPACE_EVENT_RESOURCE_TYPES).optional(),
  resourceId: z.string().min(1).optional(),
  actorType: z.enum(WORKSPACE_EVENT_ACTOR_TYPES).optional(),
  actorId: z.string().min(1).optional(),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export const BasicPaginationSchema = z.object({
  limit: z
    .string()
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 10 : Math.max(1, Math.min(100, num));
    })
    .default(10),
  page: z
    .string()
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 1 : Math.max(1, num);
    })
    .default(1),
});

export const CacheInvalidateSchema = z.object({
  resource: z
    .enum(["posts", "categories", "tags", "authors", "usage"])
    .optional(),
});

export const SystemCacheInvalidateSchema = z.object({
  workspaceId: z.string(),
  resource: z
    .enum(["posts", "categories", "tags", "authors", "usage"])
    .optional(),
});
