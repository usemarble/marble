import { sql } from "drizzle-orm";
import type { Context } from "hono";
import { createDbClient } from "../lib/db";
import { createRedisClient } from "../lib/redis";
import type { Env } from "../types/env";

type CheckResult = "ok" | "error";

interface HealthResult {
  db: CheckResult;
  redis: CheckResult;
}

const CACHE_TTL_SECONDS = 30;
const CHECK_TIMEOUT_MS = 5000;

async function check(name: string, run: () => Promise<unknown>) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS}ms`)),
      CHECK_TIMEOUT_MS
    );
  });
  try {
    await Promise.race([run(), timeout]);
    return "ok";
  } catch (error) {
    console.error(`[health] ${name} check failed:`, error);
    return "error";
  } finally {
    clearTimeout(timer);
  }
}

async function runChecks(env: Env): Promise<HealthResult> {
  const [db, redis] = await Promise.all([
    check("db", async () => {
      const client = await createDbClient(env);
      await client.execute(sql`select 1`);
    }),
    check("redis", () =>
      createRedisClient(env.REDIS_URL, env.REDIS_TOKEN).ping()
    ),
  ]);
  return { db, redis };
}

/**
 * Readiness check for uptime monitors. Unlike /status it queries Postgres
 * through Hyperdrive (query caching is off, so it reaches the origin) and
 * pings Redis. The route is public, so each colo caches the result for 30 s:
 * at most one database query per colo per window, however many requests.
 */
export async function health(c: Context<{ Bindings: Env }>) {
  // Keyed on the path alone so query strings cannot bypass the cache.
  const cacheKey = new URL("/health", c.req.url).toString();
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return withNoStore(cached);
  }

  const result = await runChecks(c.env);
  const healthy = result.db === "ok" && result.redis === "ok";
  const response = Response.json(result, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": `max-age=${CACHE_TTL_SECONDS}` },
  });
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return withNoStore(response);
}

// The Cache-Control above is for the Cache API; monitors must not reuse it.
function withNoStore(response: Response) {
  const fresh = new Response(response.body, response);
  fresh.headers.set("Cache-Control", "no-store");
  return fresh;
}
