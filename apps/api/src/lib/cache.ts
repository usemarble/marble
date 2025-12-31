import { Redis } from "@upstash/redis/cloudflare";

/** Default cache TTL in seconds (1 hour) */
const DEFAULT_TTL = 3600;

/** Cache key prefix for all cached data */
const CACHE_PREFIX = "cache";

export type CacheClient = ReturnType<typeof createCacheClient>;

/**
 * Create a cache client with helper methods for the cache-aside pattern.
 * Uses Upstash Redis for storage.
 */
export function createCacheClient(url: string, token: string) {
  const redis = new Redis({ url, token });

  return {
    /**
     * Get a cached value by key
     */
    async get<T>(key: string): Promise<T | null> {
      try {
        const value = await redis.get<T>(key);
        if (value !== null) {
          console.log(`[Cache] HIT: ${key}`);
        }
        return value;
      } catch (error) {
        console.error(`[Cache] GET error for ${key}:`, error);
        return null;
      }
    },

    /**
     * Set a cached value with optional TTL
     */
    async set<T>(key: string, value: T, ttl = DEFAULT_TTL): Promise<void> {
      try {
        await redis.set(key, value, { ex: ttl });
        console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
      } catch (error) {
        console.error(`[Cache] SET error for ${key}:`, error);
      }
    },

    /**
     * Cache-aside pattern: get from cache or fetch and cache
     */
    async getOrSet<T>(
      key: string,
      fetcher: () => Promise<T>,
      ttl = DEFAULT_TTL
    ): Promise<T> {
      try {
        const cached = await redis.get<T>(key);
        if (cached !== null) {
          console.log(`[Cache] HIT: ${key}`);
          return cached;
        }

        console.log(`[Cache] MISS: ${key}`);
        const fresh = await fetcher();
        await redis.set(key, fresh, { ex: ttl });
        return fresh;
      } catch (error) {
        console.error(`[Cache] getOrSet error for ${key}:`, error);
        return fetcher();
      }
    },

    /**
     * Cache-aside pattern for count queries
     * Optimized for caching numeric count values
     */
    async getOrSetCount<T extends number>(
      key: string,
      fetcher: () => Promise<T>,
      ttl = DEFAULT_TTL
    ): Promise<T> {
      try {
        const cached = await redis.get<T>(key);
        if (cached !== null) {
          console.log(`[Cache] HIT (count): ${key}`);
          return cached;
        }

        console.log(`[Cache] MISS (count): ${key}`);
        const fresh = await fetcher();
        await redis.set(key, fresh, { ex: ttl });
        return fresh;
      } catch (error) {
        console.error(`[Cache] getOrSetCount error for ${key}:`, error);
        return fetcher();
      }
    },

    /**
     * Invalidate cache keys matching a pattern
     * Uses SCAN to find keys iteratively, then DEL to remove them in batches
     */
    async invalidate(pattern: string): Promise<number> {
      try {
        let cursor: string | number = "0";
        const allKeys: string[] = [];
        const batchSize = 100;

        // Use SCAN to iterate through keys matching the pattern
        do {
          const [nextCursor, keys] = await redis.scan(cursor, {
            match: pattern,
            count: batchSize,
          });
          cursor = nextCursor;
          if (Array.isArray(keys)) {
            allKeys.push(...keys);
          }
        } while (String(cursor) !== "0");

        // Delete keys in batches to avoid large argument lists
        let deletedCount = 0;
        for (let i = 0; i < allKeys.length; i += batchSize) {
          const batch = allKeys.slice(i, i + batchSize);
          if (batch.length > 0) {
            const deleted = await redis.del(...batch);
            deletedCount += deleted;
          }
        }

        if (deletedCount > 0) {
          console.log(`[Cache] INVALIDATE: ${pattern} (${deletedCount} keys)`);
        }
        return deletedCount;
      } catch (error) {
        console.error(`[Cache] INVALIDATE error for ${pattern}:`, error);
        return 0;
      }
    },

    /**
     * Invalidate all cache for a specific workspace
     */
    async invalidateWorkspace(workspaceId: string): Promise<number> {
      return this.invalidate(`${CACHE_PREFIX}:${workspaceId}:*`);
    },

    /**
     * Invalidate cache for a specific resource type in a workspace
     */
    async invalidateResource(
      workspaceId: string,
      resource: "posts" | "categories" | "tags" | "authors"
    ): Promise<number> {
      return this.invalidate(`${CACHE_PREFIX}:${workspaceId}:${resource}:*`);
    },
  };
}

/**
 * Generate a cache key for a workspace resource
 */
export function cacheKey(
  workspaceId: string,
  resource: string,
  ...parts: string[]
): string {
  return [CACHE_PREFIX, workspaceId, resource, ...parts].join(":");
}

/**
 * Generate a hash from query parameters for cache key uniqueness
 */
export function hashQueryParams(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== "") {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

  // Simple hash using base64 of JSON string (truncated for brevity)
  const str = JSON.stringify(sorted);
  try {
    return Buffer.from(str, "utf-8")
      .toString("base64")
      .slice(0, 12)
      .replace(/[+/=]/g, "x");
  } catch {
    return Array.from(str)
      .reduce((hash, char) => {
        const code = char.charCodeAt(0);
        return Math.abs((hash * 31 + code) % 2_147_483_647);
      }, 0)
      .toString(36);
  }
}
