import type { Context, MiddlewareHandler, Next } from "hono";
import { createDbClient, type DbClient } from "@/lib/db";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const authorization =
  (): MiddlewareHandler => async (c: Context, next: Next) => {
    let db: DbClient;
    try {
      db = createDbClient(c.env);
    } catch {
      console.error("[Authorization] Database configuration error");
      return c.json({ error: "Internal server error" }, 500);
    }

    const workspaceId: string | null = c.req.param("workspaceId") ?? null;
    if (!workspaceId) {
      console.error("[Authorization] Workspace ID not found");
      return c.json({ error: "Workspace ID is required" }, 400);
    }

    if (!READ_METHODS.has(c.req.method)) {
      return c.json(
        {
          error: "API key required",
          message:
            "Legacy workspace ID routes are read-only. Use a private API key with the /v1 API routes for write operations.",
        },
        403
      );
    }

    try {
      const workspace = await db.organization.findUnique({
        where: {
          id: workspaceId,
        },
        select: {
          id: true,
        },
      });

      if (!workspace) {
        return c.json(
          {
            error: "Invalid workspace",
            message: "The provided workspace key is invalid or does not exist",
          },
          404
        );
      }

      await next();
    } catch (error) {
      console.error("[Authorization] Error validating workspace:", error);
      return c.json({ error: "Failed to validate workspace" }, 500);
    }
  };
