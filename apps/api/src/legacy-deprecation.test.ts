import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./types/env";

const mocks = vi.hoisted(() => ({
  workspace: vi.fn(),
  fields: vi.fn(),
  field: vi.fn(),
  apiKey: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  rateLimit: vi.fn(),
  usageCount: vi.fn(),
}));

vi.mock("@/lib/db", async () => {
  const { createMiddleware } = await import("hono/factory");
  const db = {
    query: {
      workspace: { findFirst: mocks.workspace },
      field: { findMany: mocks.fields, findFirst: mocks.field },
      apiKey: { findFirst: mocks.apiKey },
    },
    insert: () => ({ values: mocks.insert }),
    update: () => ({ set: () => ({ where: mocks.update }) }),
  };
  return {
    dbMiddleware: createMiddleware(async (c, next) => {
      c.set("db", db);
      await next();
    }),
  };
});

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow() {
      return () => undefined;
    }
    limit = mocks.rateLimit;
  },
}));

vi.mock("@upstash/redis/cloudflare", () => ({
  Redis: class {
    get() {
      return Promise.resolve(null);
    }
    set() {
      return Promise.resolve("OK");
    }
    exists() {
      return Promise.resolve(1);
    }
    incr = mocks.usageCount;
  },
}));

const { default: app } = await import("./index");
const env = {
  APP_URL: "https://app.marblecms.com",
  REDIS_URL: "https://redis.invalid",
  REDIS_TOKEN: "test-token",
} satisfies Partial<Env>;
const origin = "https://consumer.invalid";
const executionCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
  props: {},
};

function request(path: string, method = "GET") {
  return app.request(
    `https://api.marblecms.com${path}`,
    {
      method,
      headers: {
        origin,
        ...(method === "OPTIONS"
          ? { "access-control-request-method": "GET" }
          : {}),
      },
    },
    env,
    executionCtx
  );
}

const expectedLegacyHeaders = {
  Deprecation: "@1792281600",
  Sunset: "Sun, 31 Jan 2027 00:00:00 GMT",
  Link: '<https://docs.marblecms.com/api/migrate-to-api-keys>; rel="deprecation"',
  "Access-Control-Expose-Headers": "Deprecation, Sunset, Link",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": null,
};

function deprecationHeaders(response: Response) {
  return Object.fromEntries(
    Object.keys(expectedLegacyHeaders).map((name) => [
      name,
      response.headers.get(name),
    ])
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.workspace.mockResolvedValue({
    id: "workspace_123",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    subscriptions: [],
    members: [],
  });
  mocks.fields.mockResolvedValue([]);
  mocks.field.mockResolvedValue(null);
  mocks.rateLimit.mockResolvedValue({
    success: true,
    limit: 200,
    remaining: 199,
    reset: 1234,
    pending: Promise.resolve(),
  });
  mocks.usageCount.mockResolvedValue(1);
});

describe("legacy workspace-ID deprecation", () => {
  it("preserves the successful legacy response and rate-limit headers", async () => {
    const response = await request("/v1/workspace_123/fields");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ fields: [] });
    expect(response.headers.get("X-RateLimit-Limit")).toBe("200");
    expect(response.headers.get("Cache-Control")).toContain("stale-if-error");
    expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
  });

  it("includes headers on HEAD responses without a body", async () => {
    const response = await request("/v1/workspace_123/fields", "HEAD");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
  });

  it.each([
    "/v1/workspace_123/fields",
    "/v1/workspace_123/fields/",
    "/workspace_123/fields",
    "/workspace_123/fields/",
  ])("includes headers on preflight OPTIONS for %s", async (path) => {
    const response = await request(path, "OPTIONS");
    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
    expect(mocks.workspace).not.toHaveBeenCalled();
    expect(mocks.rateLimit).not.toHaveBeenCalled();
  });

  it("includes headers on a missing workspace response", async () => {
    mocks.workspace.mockResolvedValue(null);
    const response = await request("/v1/workspace_123/fields");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: "Invalid workspace" });
    expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
  });

  it("includes headers when a legacy write is forbidden", async () => {
    const response = await request("/v1/workspace_123/fields", "POST");
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: "API key required" });
    expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
  });

  it("includes headers on rate-limit failures", async () => {
    mocks.rateLimit.mockResolvedValue({
      success: false,
      pending: Promise.resolve(),
    });
    const response = await request("/v1/workspace_123/fields");
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many requests" });
    expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
  });

  it("includes headers on handler failures", async () => {
    mocks.fields.mockRejectedValue(new Error("Database unavailable"));
    const response = await request("/v1/workspace_123/fields");
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: "Failed to fetch fields",
    });
    expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
  });

  it.each(["posts", "authors", "categories", "tags", "fields"])(
    "includes headers on unversioned %s redirects and keeps the query",
    async (resource) => {
      const response = await request(
        `/workspace_123/${resource}/some-id?limit=10&page=2`
      );
      expect(response.status).toBe(308);
      expect(response.headers.get("Location")).toBe(
        `https://api.marblecms.com/v1/workspace_123/${resource}/some-id?limit=10&page=2`
      );
      expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
    }
  );

  it.each([
    [
      "/v1/workspace_123/fields/?limit=10",
      "/v1/workspace_123/fields?limit=10",
      301,
    ],
    [
      "/workspace_123/fields/?limit=10",
      "/v1/workspace_123/fields/?limit=10",
      308,
    ],
  ])(
    "includes headers on slash redirects for %s",
    async (path, target, status) => {
      const response = await request(path);
      expect(response.status).toBe(status);
      expect(response.headers.get("Location")).toBe(
        `https://api.marblecms.com${target}`
      );
      expect(deprecationHeaders(response)).toEqual(expectedLegacyHeaders);
    }
  );

  it.each([
    ["/v1/posts/hello-world", "GET", 401],
    ["/v1/posts/authors", "GET", 401],
    ["/posts/authors", "GET", 308],
    ["/posts/tags", "GET", 308],
    ["/posts", "GET", 308],
    ["/posts/", "GET", 308],
    ["/v1/posts/authors", "OPTIONS", 204],
    ["/posts/authors", "OPTIONS", 204],
    ["/", "GET", 200],
    ["/status", "GET", 200],
    ["/openapi.json", "GET", 200],
    ["/api/auth/sign-in/email", "OPTIONS", 204],
    ["/rpc/anything", "OPTIONS", 204],
    ["/ai/chat", "OPTIONS", 204],
  ])("does not deprecate %s %s", async (path, method, status) => {
    const response = await request(path, method);
    expect(response.status).toBe(status);
    for (const header of ["Deprecation", "Sunset", "Link"]) {
      expect(response.headers.has(header)).toBe(false);
    }
    expect(response.headers.has("Access-Control-Expose-Headers")).toBe(false);
  });
});
