import { createClient } from "@marble/db/workers";
import type { Context, MiddlewareHandler, Next } from "hono";
import { createPolarClient } from "../lib/polar";
import {
  checkApiUsage,
  notifyApiUsageThreshold,
  type UsageCheckResult,
} from "../lib/usage";

export const analytics = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    const path = c.req.path;
    const method = c.req.method;

    const {
      DATABASE_URL,
      REDIS_URL,
      REDIS_TOKEN,
      POLAR_ACCESS_TOKEN,
      RESEND_API_KEY,
      ENVIRONMENT,
    } = c.env;

    const workspaceId: string | null = c.req.param("workspaceId") ?? null;

    let usageResult: UsageCheckResult | null = null;

    if (DATABASE_URL && workspaceId && method !== "OPTIONS") {
      try {
        const db = createClient(DATABASE_URL);
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
        console.error("[Analytics] Error checking usage limits:", err);
      }
    }

    await next();

    if (!DATABASE_URL) {
      console.error("[Analytics] Database configuration error");
      return;
    }

    const status = c.res.status ?? 200;

    if (!workspaceId || method === "OPTIONS" || status >= 400) {
      return;
    }

    const pathParts = path.split("/").filter(Boolean);
    const endpoint =
      pathParts.length >= 3 ? `/${pathParts.slice(2).join("/")}` : null;

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

        if (RESEND_API_KEY && usageResult?.thresholdCrossed) {
          try {
            await notifyApiUsageThreshold(
              RESEND_API_KEY,
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
          where: {
            id: workspaceId,
          },
          select: {
            members: {
              where: {
                role: "owner",
              },
              select: {
                userId: true,
              },
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
                  },
                },
              ],
            });
          } catch (polarError) {
            if (polarError instanceof Error) {
              console.error(
                "[Analytics] Error ingesting polar event:",
                polarError.message
              );
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
    };

    c.executionCtx?.waitUntil(task());
  };
};
