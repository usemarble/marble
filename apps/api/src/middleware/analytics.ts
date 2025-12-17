import { createClient } from "@marble/db/workers";
import type { Context, MiddlewareHandler, Next } from "hono";
import { createPolarClient } from "../lib/polar";

export const analytics = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    const path = c.req.path;
    const method = c.req.method;

    await next();

    const { DATABASE_URL, POLAR_ACCESS_TOKEN, ENVIRONMENT } = c.env;
    if (!DATABASE_URL) {
      console.error("[Analytics] Database configuration error");
      return;
    }

    const workspaceId: string | null = c.req.param("workspaceId") ?? null;
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
            // Polar sometimes returns 500 (in dev) but still processes events
            if (polarError instanceof Error) {
              const errorDetails: Record<string, unknown> = {
                message: polarError.message,
                name: polarError.name,
              };
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
