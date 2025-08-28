import { Redis } from "@upstash/redis/cloudflare";
import type { Context, MiddlewareHandler, Next } from "hono";

export const analytics = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    // Proceed to the next middleware or route handler first
    // to avoid delaying the response
    await next();

    const redisClient = new Redis({
      url: c.env.REDIS_URL,
      token: c.env.REDIS_TOKEN,
    });

    const url = new URL(c.req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    let workspaceId: string | null = null;
    if (pathParts.length >= 2 && pathParts[0] === "v1") {
      workspaceId = pathParts[1];
    } else if (pathParts.length > 0) {
      workspaceId = pathParts[0];
    }

    const currentDate = new Date();
    const dailyKey = currentDate.toISOString().split("T")[0];
    const monthlyKey = currentDate.toISOString().slice(0, 7);

    if (workspaceId) {
      await redisClient.hincrby(
        `analytics:workspace:${workspaceId}`,
        "pageViews",
        1,
      );

      await redisClient.hincrby(
        `analytics:workspace:${workspaceId}:daily`,
        dailyKey,
        1,
      );

      await redisClient.hincrby(
        `analytics:workspace:${workspaceId}:monthly`,
        monthlyKey,
        1,
      );
    }
  };
};
