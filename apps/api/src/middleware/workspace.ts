import { createClient } from "@marble/db";
import type { Context, MiddlewareHandler, Next } from "hono";

export const validateWorkspace =
  (): MiddlewareHandler => async (c: Context, next: Next) => {
    const { DATABASE_URL } = c.env;
    if (!DATABASE_URL) {
      console.error("[Workspace] Database configuration error");
      return c.json({ error: "Internal server error" }, 500);
    }

    const workspaceId: string | null = c.req.param("workspaceId") ?? null;
    if (!workspaceId) {
      console.error("[Workspace] Workspace ID not found");
      return c.json({ error: "Workspace ID is required" }, 400);
    }

    try {
      const db = createClient(DATABASE_URL);
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
      console.error("[Workspace] Error validating workspace:", error);
      return c.json({ error: "Failed to validate workspace" }, 500);
    }
  };
