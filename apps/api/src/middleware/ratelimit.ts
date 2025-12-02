import { Ratelimit } from "@upstash/ratelimit";
import type { Context, MiddlewareHandler, Next } from "hono";
import { createRedisClient } from "../lib/redis";

export type RateLimit = {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
};

const cache = new Map();

export const ratelimit =
  (): MiddlewareHandler => async (c: Context, next: Next) => {
    try {
      const redisClient = createRedisClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

      const clientIp =
        c.req.header("x-forwarded-for") ||
        c.req.header("cf-connecting-ip") ||
        "anonymous";

      const workspaceId: string | null = c.req.param("workspaceId") ?? null;

      const identifier = workspaceId
        ? `${clientIp}:workspace:${workspaceId}`
        : clientIp;

      const rateLimiter = new Ratelimit({
        redis: redisClient,
        limiter: workspaceId
          ? Ratelimit.slidingWindow(200, "10 s")
          : Ratelimit.slidingWindow(10, "10 s"),
        ephemeralCache: cache,
      });

      const result = await rateLimiter.limit(identifier);
      c.executionCtx.waitUntil(result.pending);

      c.header("X-RateLimit-Limit", String(result.limit));
      c.header("X-RateLimit-Remaining", String(result.remaining));
      c.header("X-RateLimit-Reset", String(result.reset));

      if (!result.success) {
        return c.json({ error: "Too many requests" }, 429);
      }

      await next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      await next();
    }
  };
