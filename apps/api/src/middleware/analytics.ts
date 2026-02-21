import type { Context, MiddlewareHandler } from "hono";
import { createDbClient, type DbClient } from "../lib/db";
import { createPolarClient } from "../lib/polar";
import {
  checkApiUsage,
  notifyApiUsageThreshold,
  type UsageCheckResult,
} from "../lib/usage";
import type { ApiKeyApp } from "../types/env";

interface AnalyticsTaskParams {
  db: ReturnType<typeof createDbClient>;
  workspaceId: string;
  endpoint: string | null;
  method: string;
  status: number;
  usageResult: UsageCheckResult | null;
  resendApiKey?: string;
  polarAccessToken?: string;
  environment?: string;
  apiKeyType?: string;
}

export async function runAnalyticsTask({
  db,
  workspaceId,
  endpoint,
  method,
  status,
  usageResult,
  resendApiKey,
  polarAccessToken,
  environment,
  apiKeyType,
}: AnalyticsTaskParams): Promise<void> {
  try {
    await db.usageEvent.create({
      data: {
        type: "api_request",
        workspaceId,
        endpoint,
      },
    });

    if (resendApiKey && usageResult?.thresholdCrossed) {
      try {
        await notifyApiUsageThreshold(
          resendApiKey,
          db,
          workspaceId,
          usageResult.thresholdCrossed,
          usageResult.currentUsage + 1,
          usageResult.limit
        );
      } catch (usageError) {
        console.error(
          "[Analytics] Error sending usage threshold email:",
          usageError
        );
      }
    }

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

    if (polarAccessToken) {
      const isProduction = environment === "production";
      const polar = createPolarClient(polarAccessToken, isProduction);
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
          console.error("[Analytics] Polar error:", polarError.message);
        }
      }
    } else {
      console.log(
        "[Analytics] Skipping Polar: POLAR_ACCESS_TOKEN not configured"
      );
    }
  } catch (err) {
    console.error("[Analytics] Error in analytics task:", err);
  }
}

async function checkUsage(
  c: Context,
  workspaceId: string
): Promise<UsageCheckResult | null> {
  const { REDIS_URL, REDIS_TOKEN } = c.env;

  if (!workspaceId) {
    return null;
  }

  try {
    const db = createDbClient(c.env);
    const redis =
      REDIS_URL && REDIS_TOKEN
        ? { url: REDIS_URL, token: REDIS_TOKEN }
        : undefined;
    const result = await checkApiUsage(db, workspaceId, redis);

    if (!result.allowed) {
      return result;
    }

    return result;
  } catch (err) {
    console.error("[Analytics] Error checking usage limits:", err);
    return null;
  }
}

/**
 * Analytics middleware for API key authenticated routes.
 * Checks usage limits before the request and logs analytics after.
 */
export const analytics = (): MiddlewareHandler<ApiKeyApp> => {
  return async (c, next) => {
    const method = c.req.method;
    const workspaceId = c.get("workspaceId");

    let usageResult: UsageCheckResult | null = null;

    if (workspaceId && method !== "OPTIONS") {
      usageResult = await checkUsage(c, workspaceId);

      if (usageResult && !usageResult.allowed) {
        return c.json(
          {
            error: "Usage limit exceeded",
            message:
              "You have reached your API request limit for this billing period. Please upgrade your plan or wait until your usage resets.",
          },
          429
        );
      }
    }

    await next();

    const { RESEND_API_KEY, POLAR_ACCESS_TOKEN, ENVIRONMENT } = c.env;

    let db: DbClient;
    try {
      db = createDbClient(c.env);
    } catch {
      console.error("[Analytics] Database configuration error");
      return;
    }

    const apiKeyType = c.get("apiKeyType");
    const status = c.res.status ?? 200;

    if (!workspaceId || method === "OPTIONS" || status >= 400) {
      return;
    }

    const path = c.req.path;
    const pathParts = path.split("/").filter(Boolean);
    const endpoint = pathParts.length >= 1 ? `/${pathParts.join("/")}` : null;

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
        apiKeyType,
      })
    );
  };
};
