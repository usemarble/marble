import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const rateLimitHeaders = (
  limit: number,
  remaining: number,
  reset: number,
): Headers => {
  return new Headers({
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  });
};

export const aiSuggestionsRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "60 s"),
  ephemeralCache: new Map(),
  prefix: "ai-suggestions-rate-limit",
});
