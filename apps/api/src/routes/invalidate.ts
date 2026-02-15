import { Hono } from "hono";
import { createCacheClient } from "../lib/cache";
import type { ApiKeyApp } from "../types/env";
import { CacheInvalidateSchema } from "../validations/misc";

const invalidate = new Hono<ApiKeyApp>();

/**
 * Cache invalidation endpoint
 * Allows CMS or admin to invalidate cached data when content changes
 *
 * POST /v1/cache/invalidate
 * - Invalidates all cache for workspace if no resource specified
 * - Invalidates specific resource cache if resource is provided
 *
 * Requires API key authentication (private key recommended)
 */
invalidate.post("/", async (c) => {
  const workspaceId = c.get("workspaceId");
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  try {
    const rawBody = await c.req.json();
    const validation = CacheInvalidateSchema.safeParse(rawBody);

    if (!validation.success) {
      return c.json(
        {
          error: "Invalid request body",
          details: validation.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400
      );
    }

    const { resource } = validation.data;

    let invalidatedCount: number;

    if (resource === "usage") {
      const redis = new (await import("@upstash/redis/cloudflare")).Redis({
        url: c.env.REDIS_URL,
        token: c.env.REDIS_TOKEN,
      });
      const deleted = await redis.del(`usage:meta:${workspaceId}`);
      return c.json({
        success: true,
        message: `Invalidated usage cache${deleted ? "" : " (was not cached)"}`,
        workspaceId,
        resource,
      });
    }

    if (resource) {
      // Invalidate specific resource
      invalidatedCount = await cache.invalidateResource(workspaceId, resource);
      return c.json({
        success: true,
        message: `Invalidated ${invalidatedCount} cache entries for ${resource}`,
        workspaceId,
        resource,
      });
    }

    // Invalidate all workspace cache
    invalidatedCount = await cache.invalidateWorkspace(workspaceId);
    return c.json({
      success: true,
      message: `Invalidated ${invalidatedCount} cache entries for workspace`,
      workspaceId,
    });
  } catch (error) {
    console.error("[Cache] Invalidation error:", error);
    return c.json(
      {
        error: "Failed to invalidate cache",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default invalidate;
