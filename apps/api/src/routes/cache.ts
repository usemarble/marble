import { Hono } from "hono";
import { createCacheClient } from "../lib/cache";
import type { Env } from "../types/env";
import { SystemCacheInvalidateSchema } from "../validations/misc";

const cacheInvalidate = new Hono<{ Bindings: Env }>();

cacheInvalidate.post("/", async (c) => {
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  try {
    const rawBody = await c.req.json();
    const validation = SystemCacheInvalidateSchema.safeParse(rawBody);

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

    const { workspaceId, resource } = validation.data;

    let invalidatedCount: number;

    if (resource) {
      invalidatedCount = await cache.invalidateResource(workspaceId, resource);
      return c.json({
        success: true,
        message: `Invalidated ${invalidatedCount} cache entries for ${resource}`,
        workspaceId,
        resource,
      });
    }

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

export default cacheInvalidate;
