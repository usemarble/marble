import { createClient } from "@marble/db";
import type { Context, MiddlewareHandler, Next } from "hono";
import { createPolarClient } from "../lib/polar";

export const analytics = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const path = c.req.path;
    const method = c.req.method;

    console.log(`[Analytics] Request started: ${method} ${path}`);

    // Proceed to the next middleware or route handler to avoid delaying the response
    await next();

    const requestDuration = Date.now() - startTime;
    console.log(
      `[Analytics] Request completed: ${method} ${path} (${requestDuration}ms)`
    );

    const { DATABASE_URL, POLAR_ACCESS_TOKEN, ENVIRONMENT } = c.env;
    if (!DATABASE_URL) {
      console.log("[Analytics] Skipping: DATABASE_URL not configured");
      return;
    }

    const workspaceId: string | null = c.req.param("workspaceId") ?? null;
    const status = c.res.status ?? 200;

    if (!workspaceId || method === "OPTIONS" || status >= 400) {
      console.log(
        `[Analytics] Skipping: workspaceId=${workspaceId}, method=${method}, status=${status}`
      );
      return;
    }

    const pathParts = path.split("/").filter(Boolean);
    const endpoint =
      pathParts.length >= 3 ? `/${pathParts.slice(2).join("/")}` : null;

    console.log(
      `[Analytics] Starting async task: workspaceId=${workspaceId}, endpoint=${endpoint}`
    );

    const task = async () => {
      try {
        console.log("[Analytics] Storing usage event in database...");
        // Store usage event in database
        const db = createClient(DATABASE_URL);
        await db.usageEvent.create({
          data: {
            type: "api_request",
            workspaceId,
            endpoint,
          },
        });
        console.log("[Analytics] Usage event stored successfully");

        if (POLAR_ACCESS_TOKEN) {
          console.log("[Analytics] Ingesting event to Polar...");
          const isProduction = ENVIRONMENT === "production";
          const polar = createPolarClient(POLAR_ACCESS_TOKEN, isProduction);
          try {
            await polar.events.ingest({
              events: [
                {
                  name: "api_request",
                  externalCustomerId: workspaceId,
                  metadata: {
                    ...(endpoint && { endpoint }),
                    method,
                    status,
                  },
                },
              ],
            });
            console.log("[Analytics] Polar event ingested successfully");
          } catch (polarError) {
            // Polar sometimes returns 500 but still processes events
            if (polarError instanceof Error) {
              const errorDetails: Record<string, unknown> = {
                message: polarError.message,
                name: polarError.name,
              };

              console.error(
                "[Analytics] Polar ingestion error (events may still be processed):",
                JSON.stringify(errorDetails, null, 2)
              );
            } else {
              console.error(
                "[Analytics] Polar ingestion error (events may still be processed):",
                polarError
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
    console.log("[Analytics] Async task scheduled, response can be sent");
  };
};
