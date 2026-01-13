import { redis } from "./redis";

const CACHE_PREFIX = "cms:cache";
const DEFAULT_TTL = 300; // 5 minutes

/**
 * Cache utilities for resource pages
 */
export const cache = {
  /**
   * Get a cached value by key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await redis.get<T>(key);
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
        return cached;
      }

      const fresh = await fetcher();
      await redis.set(key, fresh, { ex: ttl });
      return fresh;
    } catch (error) {
      console.error(`[Cache] getOrSet error for ${key}:`, error);
      return fetcher();
    }
  },

  /**
   * Invalidate cache keys matching a pattern using SCAN + DEL
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      let cursor: string | number = "0";
      const allKeys: string[] = [];
      const batchSize = 100;

      // Use SCAN to iterate through keys matching the pattern
      do {
        const result: [string, string[]] = await redis.scan(cursor, {
          match: pattern,
          count: batchSize,
        });
        cursor = result[0];
        const keys = result[1];
        if (Array.isArray(keys)) {
          allKeys.push(...keys);
        }
      } while (String(cursor) !== "0");

      // Delete keys in batches
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
   * Invalidate all media cache for a workspace
   */
  async invalidateMedia(workspaceId: string): Promise<number> {
    return this.invalidatePattern(`${CACHE_PREFIX}:media:${workspaceId}:*`);
  },

  /**
   * Generate a cache key from parts
   */
  key(...parts: string[]): string {
    return [CACHE_PREFIX, ...parts].join(":");
  },
};
