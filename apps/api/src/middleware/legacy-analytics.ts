import type { Context, MiddlewareHandler, Next } from "hono";
import { createDbClient, type DbClient } from "../lib/db";
import { checkApiUsage, type UsageCheckResult } from "../lib/usage";
import { runAnalyticsTask } from "./analytics";

/**
 * Legacy analytics middleware for workspace ID authenticated routes.
 * Same as analytics() but reads workspaceId from URL params instead of context.
 */
export const legacyAnalytics = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    const method = c.req.method;
    const workspaceId: string | null = c.req.param("workspaceId") ?? null;

    const { REDIS_URL, REDIS_TOKEN } = c.env;

    let usageResult: UsageCheckResult | null = null;

    if (workspaceId && method !== "OPTIONS") {
      try {
        const db = createDbClient(c.env);
        const redis =
          REDIS_URL && REDIS_TOKEN
            ? { url: REDIS_URL, token: REDIS_TOKEN }
            : undefined;
        usageResult = await checkApiUsage(db, workspaceId, redis);

        if (!usageResult.allowed) {
          return c.json(
            {
              error: "Usage limit exceeded",
              message:
                "You have reached your API request limit for this billing period. Please upgrade your plan or wait until your usage resets.",
            },
            429
          );
        }
      } catch (err) {
        console.error("[LegacyAnalytics] Error checking usage limits:", err);
      }
    }

    await next();

    let db: DbClient;
    try {
      db = createDbClient(c.env);
    } catch {
      console.error("[LegacyAnalytics] Database configuration error");
      return;
    }

    const status = c.res.status ?? 200;

    if (!workspaceId || method === "OPTIONS" || status >= 400) {
      return;
    }

    const path = c.req.path;
    const pathParts = path.split("/").filter(Boolean);
    const endpoint =
      pathParts.length >= 3 ? `/${pathParts.slice(2).join("/")}` : null;

    const { RESEND_API_KEY, POLAR_ACCESS_TOKEN, ENVIRONMENT } = c.env;

    c.executionCtx?.waitUntil(
      runAnalyticsTask({
        db,
        workspaceId,
        endpoint,
        method,
        status,
        usageResult,
        resendApiKey: RESEND_API_KEY,
        polarAccessToken: POLAR_ACCESS_TOKEN,
        environment: ENVIRONMENT,
      })
    );
  };
};
