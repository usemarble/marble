import { Redis } from "@upstash/redis/cloudflare";
import type { Context, MiddlewareHandler, Next } from "hono";

export const analytics = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    // Proceed to the next middleware or route handler first
    // to avoid delaying the response
    await next();

    const { REDIS_URL, REDIS_TOKEN } = c.env;
    if (!REDIS_URL || !REDIS_TOKEN) {
      return;
    }

    const redisClient = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
    const workspaceId: string | null = c.req.param("workspaceId") ?? null;
    const monthlyKey = new Date().toISOString().slice(0, 7);

    const method = c.req.method;
    const status = c.res.status ?? 200;
    if (!workspaceId || method === "OPTIONS" || status >= 400) {
      return;
    }

    const task = async () => {
      const p = redisClient.pipeline();
      p.hincrby(`analytics:workspace:${workspaceId}`, "pageViews", 1);
      p.hincrby(`analytics:workspace:${workspaceId}:monthly`, monthlyKey, 1);
      await p.exec();
    };
    c.executionCtx?.waitUntil(
      task().catch((err) => {
        console.error("analytics error:", err);
      }),
    );
  };
};
