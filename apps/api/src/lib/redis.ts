import { Redis } from "@upstash/redis/cloudflare";

export function createRedisClient(url: string, token: string): Redis {
  return new Redis({ url, token });
}
