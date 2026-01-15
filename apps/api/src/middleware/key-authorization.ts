import { createClient } from "@marble/db/workers";
import type { MiddlewareHandler } from "hono";
import { hashApiKey } from "../lib/crypto";
import type { ApiKeyApp } from "../types/env";

/**
 * API Key Authorization Middleware
 * Verifies API keys from Authorization header or ?key= query parameter
 * Sets workspaceId and apiKeyId in context for downstream use
 */
export const keyAuthorization =
  (): MiddlewareHandler<ApiKeyApp> => async (c, next) => {
    const { DATABASE_URL } = c.env;
    if (!DATABASE_URL) {
      console.error("[KeyAuth] Database configuration error");
      return c.json({ error: "Internal server error" }, 500);
    }

    let apiKey: string | null = null;

    const authHeader = c.req.header("Authorization");
    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.substring(7);
      } else {
        apiKey = authHeader;
      }
    }

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

      const hashedKey = await hashApiKey(apiKey);

      const key = await db.apiKey.findUnique({
        where: { key: hashedKey },
        select: {
          id: true,
          workspaceId: true,
          type: true,
          scopes: true,
          enabled: true,
          expiresAt: true,
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

      if (!key.enabled) {
        return c.json(
          {
            error: "Unauthorized",
            message: "API key is disabled",
          },
          401
        );
      }

      if (key.expiresAt && key.expiresAt < new Date()) {
        return c.json(
          {
            error: "Unauthorized",
            message: "API key has expired",
          },
          401
        );
      }

      c.executionCtx?.waitUntil(
        db.apiKey.update({
          where: { id: key.id },
          data: { lastUsed: new Date(), requestCount: { increment: 1 } },
        })
      );

      c.set("workspaceId", key.workspaceId);
      c.set("apiKeyId", key.id);
      c.set("apiKeyType", key.type);

      await next();
    } catch (error) {
      console.error("[KeyAuth] Error verifying API key:", error);
      return c.json({ error: "Failed to verify API key" }, 500);
    }
  };
