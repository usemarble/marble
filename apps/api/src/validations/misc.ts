import {
  WORKSPACE_EVENT_ACTOR_TYPES as EVENT_ACTOR_TYPES,
  WORKSPACE_EVENT_RESOURCE_TYPES as EVENT_RESOURCE_TYPES,
  WORKSPACE_EVENT_SOURCES as EVENT_SOURCES,
  WORKSPACE_EVENT_TYPES as EVENT_TYPES,
} from "@marble/events";
import { z } from "zod";
import { JsonObjectSchema } from "@/validations/json";

export const WORKSPACE_EVENT_TYPES = EVENT_TYPES;
export const WORKSPACE_EVENT_SOURCES = EVENT_SOURCES;
export const WORKSPACE_EVENT_ACTOR_TYPES = EVENT_ACTOR_TYPES;
export const WORKSPACE_EVENT_RESOURCE_TYPES = EVENT_RESOURCE_TYPES;

export const InternalEventSchema = z
  .object({
    type: z.enum(EVENT_TYPES),
    workspaceId: z.string().min(1),
    source: z.enum(EVENT_SOURCES).optional().default("dashboard"),
    resourceType: z.enum(EVENT_RESOURCE_TYPES).optional(),
    resourceId: z.string().min(1).optional(),
    actorType: z.enum(EVENT_ACTOR_TYPES).optional(),
    actorId: z.string().min(1).optional(),
    payload: JsonObjectSchema.optional().default({}),
    isTest: z.boolean().optional().default(false),
    targetWebhookEndpointId: z.string().min(1).optional(),
  })
  .refine(
    (event) => Boolean(event.resourceType) === Boolean(event.resourceId),
    {
      message: "resourceType and resourceId must be provided together",
      path: ["resourceId"],
    }
  );

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
