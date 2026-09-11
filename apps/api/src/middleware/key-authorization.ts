import { apiKey } from "@marble/drizzle/schema";
import { eq, sql } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
import { hashApiKey } from "@/lib/crypto";
import { createDbClient } from "@/lib/db";
import type { ApiKeyApp } from "@/types/env";

/**
 * API Key Authorization Middleware
 * Verifies API keys from Authorization header or ?key= query parameter
 * Sets workspaceId and apiKeyId in context for downstream use
 */
export const keyAuthorization =
  (): MiddlewareHandler<ApiKeyApp> => async (c, next) => {
    const db = c.get("db");

    let apiKeyValue: string | null = null;

    const authHeader = c.req.header("Authorization");
    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        apiKeyValue = authHeader.substring(7);
      } else {
        apiKeyValue = authHeader;
      }
    }

    if (!apiKeyValue) {
      apiKeyValue = c.req.query("key") ?? null;
    }

    if (!apiKeyValue) {
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
      const hashedKey = await hashApiKey(apiKeyValue);

      const key = await db.query.apiKey.findFirst({
        where: eq(apiKey.key, hashedKey),
        columns: {
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
        (async () => {
          const bgDb = await createDbClient(c.env);
          await bgDb
            .update(apiKey)
            .set({
              lastUsed: new Date(),
              requestCount: sql`${apiKey.requestCount} + 1`,
            })
            .where(eq(apiKey.id, key.id));
        })()
      );

      c.set("workspaceId", key.workspaceId);
      c.set("apiKeyId", key.id);
      c.set("apiKeyType", key.type);
      c.set("apiKeyScopes", key.scopes);

      if (c.req.method !== "GET" && key.type !== "private") {
        return c.json(
          {
            error: "Forbidden",
            message:
              "Write operations require a private API key (msk_...). Public keys are read-only.",
          },
          403
        );
      }

      await next();
    } catch (error) {
      console.error("[KeyAuth] Error verifying API key:", error);
      return c.json({ error: "Failed to verify API key" }, 500);
    }
  };
