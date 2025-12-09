import { createClient } from "@marble/db/workers";
import { hashApiKey } from "@marble/utils";
import type { Context, MiddlewareHandler, Next } from "hono";

/**
 * API Key Authentication Middleware
 * Verifies API keys from Authorization header or ?key= query parameter
 * Checks rate limits and validates permissions
 */
export const apiKeyAuth = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    const { DATABASE_URL } = c.env;
    if (!DATABASE_URL) {
      console.error("[ApiKeyAuth] Database configuration error");
      return c.json({ error: "Internal server error" }, 500);
    }

    // Extract API key from Authorization header or query parameter
    let apiKey: string | null = null;

    // Check Authorization header (Bearer token)
    const authHeader = c.req.header("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    }

    // Fallback to query parameter
    if (!apiKey) {
      apiKey = c.req.query("key") ?? null;
    }

    if (!apiKey) {
      return c.json(
        {
          error: "Unauthorized",
          message:
            "API key required. Provide via Authorization header or ?key= query parameter",
        },
        401
      );
    }

    try {
      const db = createClient(DATABASE_URL);

      // Hash the incoming key to look it up
      const hashedKey = hashApiKey(apiKey);

      // Find the API token
      const key = await db.apiKey.findUnique({
        where: { key: hashedKey },
        select: {
          id: true,
          workspaceId: true,
          type: true,
          scopes: true,
          enabled: true,
          expiresAt: true,
          rateLimitTimeWindow: true,
          rateLimitMax: true,
          lastRequest: true,
          requestCount: true,
        },
      });

      if (!key) {
        return c.json(
          {
            error: "Unauthorized",
            message: "Invalid API key",
          },
          401
        );
      }

      // Check if key is enabled
      if (!key.enabled) {
        return c.json(
          {
            error: "Unauthorized",
            message: "API key is disabled",
          },
          401
        );
      }

      // Check if key is expired
      if (key.expiresAt && key.expiresAt < new Date()) {
        return c.json(
          {
            error: "Unauthorized",
            message: "API key has expired",
          },
          401
        );
      }

      // Check rate limits (if configured)
      if (key.rateLimitTimeWindow && key.rateLimitMax) {
        const now = new Date();
        const windowStart = key.lastRequest
          ? new Date(key.lastRequest.getTime() + key.rateLimitTimeWindow)
          : null;

        // If we're still within the rate limit window
        if (windowStart && now < windowStart) {
          if (key.requestCount >= key.rateLimitMax) {
            const retryAfter = Math.ceil(
              (windowStart.getTime() - now.getTime()) / 1000
            );
            return c.json(
              {
                error: "Rate limit exceeded",
                message: `Too many requests. Try again in ${retryAfter} seconds`,
                retryAfter,
              },
              429
            );
          }
          // Increment request count
          await db.apiKey.update({
            where: { id: key.id },
            data: {
              requestCount: key.requestCount + 1,
              lastUsed: now,
            },
          });
        } else {
          // Reset the window
          await db.apiKey.update({
            where: { id: key.id },
            data: {
              requestCount: 1,
              lastRequest: now,
              lastUsed: now,
            },
          });
        }
      } else {
        // No rate limiting, just update lastUsed
        await db.apiKey.update({
          where: { id: key.id },
          data: {
            lastUsed: new Date(),
          },
        });
      }

      // Attach key info to context for use in routes
      c.set("workspaceId", key.workspaceId);
      c.set("apiKeyType", key.type);

      await next();
    } catch (error) {
      console.error("[ApiKeyAuth] Error verifying API key:", error);
      return c.json({ error: "Failed to verify API key" }, 500);
    }
  };
};
