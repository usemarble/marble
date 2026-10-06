import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
const redis = {
  get: vi.fn(async (key: string) => store.get(key) ?? null),
  set: vi.fn(async (key: string, value: unknown) => {
    store.set(key, value);
    return "OK";
  }),
};

vi.mock("@upstash/redis/cloudflare", () => ({
  Redis: vi.fn(() => redis),
}));

const { createCacheClient } = await import("./cache");

describe("getOrSet", () => {
  const cache = createCacheClient("https://redis.example.invalid", "token");

  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it("fetches once and caches the value on a miss", async () => {
    const fetcher = vi.fn(async () => ({ id: "post" }));

    expect(await cache.getOrSet("k", fetcher)).toEqual({ id: "post" });
    expect(await cache.getOrSet("k", fetcher)).toEqual({ id: "post" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns a missing row without caching it or fetching twice", async () => {
    const fetcher = vi.fn(async () => undefined);

    expect(await cache.getOrSet("k", fetcher)).toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(redis.set).not.toHaveBeenCalled();
  });

  it("doesn't retry a fetcher that throws", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("db down");
    });

    await expect(cache.getOrSet("k", fetcher)).rejects.toThrow("db down");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("falls back to the fetcher when Redis fails", async () => {
    redis.get.mockRejectedValueOnce(new Error("redis down"));
    redis.set.mockRejectedValueOnce(new Error("redis down"));
    const fetcher = vi.fn(async () => 3);

    expect(await cache.getOrSetCount("k", fetcher)).toBe(3);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
