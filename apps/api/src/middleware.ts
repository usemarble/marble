import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import type { Context, MiddlewareHandler, Next } from "hono";

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
  success: boolean;
}

// Create a cache to store rate limit results
const cache = new Map();

// Create a middleware function that can be used with Hono
export const ratelimit = (): MiddlewareHandler => {
  return async (c: Context, next: Next) => {
    try {
      const redisClient = new Redis({
        url: c.env.REDIS_URL,
        token: c.env.REDIS_TOKEN,
      });

      // Get client IP or a unique identifier
      const clientIp =
        c.req.header("x-forwarded-for") ||
        c.req.header("cf-connecting-ip") ||
        "anonymous";

      // Check if there's a workspaceId in the URL path
      const url = new URL(c.req.url);
      const pathParts = url.pathname.split("/").filter(Boolean);
      const workspaceId = pathParts.length > 0 ? pathParts[0] : null;

      // Create a composite identifier that includes both IP and workspaceId if available
      const identifier = workspaceId
        ? `${clientIp}:workspace:${workspaceId}`
        : clientIp;

      // Apply different rate limits based on whether a workspaceId is present
      const rateLimiter = new Ratelimit({
        redis: redisClient,
        limiter: workspaceId
          ? Ratelimit.slidingWindow(200, "10 s")
          : Ratelimit.slidingWindow(10, "10 s"),
        ephemeralCache: cache,
      });

      // Apply rate limiting
      const result = await rateLimiter.limit(identifier);

      // Add rate limit info to response headers
      c.header("X-RateLimit-Limit", String(result.limit));
      c.header("X-RateLimit-Remaining", String(result.remaining));
      c.header("X-RateLimit-Reset", String(result.reset));

      // If rate limit exceeded, return 429 Too Many Requests
      if (!result.success) {
        return c.json({ error: "Too many requests" }, 429);
      }

      // Continue to the next middleware or route handler
      await next();
    } catch (error) {
      console.error("Rate limiting error:", error);
      // Continue even if rate limiting fails
      await next();
    }
  };
};
