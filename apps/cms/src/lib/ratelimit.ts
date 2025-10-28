import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const rateLimitHeaders = (
  limit: number,
  remaining: number,
  reset: number
): Headers =>
  new Headers({
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  });

export const aiSuggestionsRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  ephemeralCache: new Map(),
  prefix: "ai-suggestions-rate-limit",
});

export const userAvatarUploadRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "30 m"),
  ephemeralCache: new Map(),
  prefix: "user-avatar-upload-rate-limit",
});
