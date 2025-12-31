import type { MiddlewareHandler } from "hono";
import type { Env } from "../types/env";

/**
 * System Secret Authentication Middleware
 * Validates X-System-Secret header for internal cache invalidation requests
 */
export const systemAuth =
  (): MiddlewareHandler<{ Bindings: Env }> => async (c, next) => {
    const systemSecret = c.env.SYSTEM_SECRET;
    const providedSecret = c.req.header("X-System-Secret");

    if (!systemSecret) {
      console.error("[SystemAuth] SYSTEM_SECRET not configured");
      return c.json({ error: "Internal server error" }, 500);
    }

    if (!providedSecret || providedSecret !== systemSecret) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Invalid or missing system secret",
        },
        401
      );
    }

    await next();
  };
