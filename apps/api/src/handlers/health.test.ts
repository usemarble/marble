import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "../types/env";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  ping: vi.fn(),
  createDbClient: vi.fn(),
}));

vi.mock("../lib/db", () => ({ createDbClient: mocks.createDbClient }));
vi.mock("../lib/redis", () => ({
  createRedisClient: () => ({ ping: mocks.ping }),
}));

const { health } = await import("./health");

const store = new Map<string, Response>();
vi.stubGlobal("caches", {
  default: {
    match: async (key: string) => store.get(key)?.clone(),
    put: async (key: string, response: Response) => {
      store.set(key, response);
    },
  },
});

const app = new Hono<{ Bindings: Env }>().get("/health", health);
const executionCtx = {
  waitUntil: vi.fn((promise: Promise<unknown>) => promise),
  passThroughOnException: vi.fn(),
  props: {},
};
const request = async (url = "https://api.marblecms.com/health") => {
  const response = await app.fetch(new Request(url), {} as Env, executionCtx);
  await Promise.all(executionCtx.waitUntil.mock.results.map((r) => r.value));
  return response;
};

beforeEach(() => {
  vi.clearAllMocks();
  store.clear();
  mocks.createDbClient.mockResolvedValue({ execute: mocks.execute });
  mocks.execute.mockResolvedValue({ rows: [{ "?column?": 1 }] });
  mocks.ping.mockResolvedValue("PONG");
});

describe("GET /health", () => {
  it("returns 200 when the database and Redis both answer", async () => {
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ db: "ok", redis: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.execute).toHaveBeenCalledOnce();
  });

  it("returns 503 naming the database when its query fails", async () => {
    mocks.execute.mockRejectedValue(new Error("connection refused"));
    const response = await request();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ db: "error", redis: "ok" });
  });

  it("returns 503 naming Redis when its ping fails", async () => {
    mocks.ping.mockRejectedValue(new Error("unauthorized"));
    const response = await request();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ db: "ok", redis: "error" });
  });

  it("reports a database connection that cannot be opened", async () => {
    mocks.createDbClient.mockRejectedValue(new Error("no connection string"));
    const response = await request();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ db: "error", redis: "ok" });
  });

  it("serves a cached result instead of querying the database again", async () => {
    await request();
    mocks.execute.mockRejectedValue(new Error("should not be called"));
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ db: "ok", redis: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.execute).toHaveBeenCalledOnce();
  });

  it("ignores query strings when reading the cache", async () => {
    await request();
    await request("https://api.marblecms.com/health?nocache=1");
    expect(mocks.execute).toHaveBeenCalledOnce();
  });

  it("caches a failure too, so an outage does not hammer the database", async () => {
    mocks.execute.mockRejectedValue(new Error("connection refused"));
    await request();
    const response = await request();
    expect(response.status).toBe(503);
    expect(mocks.execute).toHaveBeenCalledOnce();
  });
});
