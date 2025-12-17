import { createClient } from "@marble/db/workers";
import type { MiddlewareHandler } from "hono";
import { createPolarClient } from "../lib/polar";
import type { ApiKeyApp } from "../types/env";

/**
 * API Key Analytics Middleware
 * Logs usage events to database and Polar for API key authenticated routes
 * Reads workspaceId from context (set by keyAuthorization middleware)
 */
export const keyAnalytics = (): MiddlewareHandler<ApiKeyApp> => {
  return async (c, next) => {
    const path = c.req.path;
    const method = c.req.method;

    await next();

    const { DATABASE_URL, POLAR_ACCESS_TOKEN, ENVIRONMENT } = c.env;
    if (!DATABASE_URL) {
      console.error("[KeyAnalytics] Database configuration error");
      return;
    }

    const workspaceId = c.get("workspaceId");
    const apiKeyType = c.get("apiKeyType");
    const status = c.res.status ?? 200;

    if (method === "OPTIONS" || status >= 400) {
      return;
    }

    // Parse endpoint from path
    // After URL rewrite in app.ts, path is like /posts or /posts/slug (no /v1 prefix)
    const pathParts = path.split("/").filter(Boolean);
    const endpoint = pathParts.length >= 1 ? `/${pathParts.join("/")}` : null;

    const task = async () => {
      try {
        const db = createClient(DATABASE_URL);

        await db.usageEvent.create({
          data: {
            type: "api_request",
            workspaceId,
            endpoint,
          },
        });

        let customerId = workspaceId;
        const organization = await db.organization.findFirst({
          where: { id: workspaceId },
          select: {
            members: {
              where: { role: "owner" },
              select: { userId: true },
            },
          },
        });

        if (organization?.members[0]?.userId) {
          customerId = organization.members[0].userId;
        }

        if (POLAR_ACCESS_TOKEN) {
          const isProduction = ENVIRONMENT === "production";
          const polar = createPolarClient(POLAR_ACCESS_TOKEN, isProduction);
          try {
            await polar.events.ingest({
              events: [
                {
                  name: "api_request",
                  externalCustomerId: customerId,
                  metadata: {
                    ...(endpoint && { endpoint }),
                    method,
                    status,
                    ...(apiKeyType && { apiKeyType }),
                  },
                },
              ],
            });
          } catch (polarError) {
            if (polarError instanceof Error) {
              console.error("[KeyAnalytics] Polar error:", polarError.message);
            }
          }
        }
      } catch (err) {
        console.error("[KeyAnalytics] Error in analytics task:", err);
      }
    };

    c.executionCtx?.waitUntil(task());
  };
};
