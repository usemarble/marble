import { Ratelimit } from "@upstash/ratelimit";
import type { Context, MiddlewareHandler, Next } from "hono";
import { createRedisClient } from "../lib/redis";

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
}

const cache = new Map();

type RateLimitMode = "workspace" | "apiKey";

/**
 * Rate limiting middleware using Upstash Redis
 * @param mode - "workspace" for legacy routes (IP + workspaceId), "apiKey" for API key routes
 */
export const ratelimit =
  (mode: RateLimitMode = "workspace"): MiddlewareHandler =>
  async (c: Context, next: Next) => {
    try {
      const redisClient = createRedisClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

      const clientIp =
        c.req.header("x-forwarded-for") ||
        c.req.header("cf-connecting-ip") ||
        "anonymous";

      let identifier: string;
      let limitConfig: ReturnType<typeof Ratelimit.slidingWindow>;

      if (mode === "apiKey") {
        // For API key routes, we rate limit by IP initially
        // After keyAuthorization runs, we could enhance this
        // For now: IP-based with higher limits since API keys are trusted
        identifier = `apikey:${clientIp}`;
        limitConfig = Ratelimit.slidingWindow(200, "10 s");
      } else {
        // Legacy workspace mode: IP + workspaceId
        const workspaceId: string | null = c.req.param("workspaceId") ?? null;
        identifier = workspaceId
          ? `${clientIp}:workspace:${workspaceId}`
          : clientIp;
        limitConfig = workspaceId
          ? Ratelimit.slidingWindow(200, "10 s")
          : Ratelimit.slidingWindow(10, "10 s");
      }

      const rateLimiter = new Ratelimit({
        redis: redisClient,
        limiter: limitConfig,
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
