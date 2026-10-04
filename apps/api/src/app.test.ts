import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./types/env";

const mocks = vi.hoisted(() => ({
  db: {},
  createAuth: vi.fn(),
  handler: vi.fn(),
  database: vi.fn(),
}));

vi.mock("@marble/auth", () => ({ createAuth: mocks.createAuth }));
vi.mock("@/lib/db", async () => {
  const { createMiddleware } = await import("hono/factory");
  return {
    dbMiddleware: createMiddleware(async (c, next) => {
      mocks.database();
      c.set("db", mocks.db);
      await next();
    }),
  };
});

const { default: app } = await import("./app");
const env = { APP_URL: "https://staging.marblecms.com" } as Env;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createAuth.mockReturnValue({ handler: mocks.handler });
  mocks.handler.mockImplementation(() => Response.json({ ok: true }));
});

describe("Worker auth mount", () => {
  it("passes each invocation's database, bindings and raw request to auth", async () => {
    const request = new Request(
      "https://api-staging.marblecms.com/api/auth/ok",
      {
        headers: { origin: env.APP_URL },
      }
    );
    const response = await app.fetch(request, env);
    expect(response.status).toBe(200);
    expect(mocks.database).toHaveBeenCalledOnce();
    expect(mocks.createAuth).toHaveBeenCalledWith({ db: mocks.db, env });
    expect(mocks.handler).toHaveBeenCalledWith(request);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      env.APP_URL
    );
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true"
    );
  });

  it("answers credentialed preflights without opening a database client", async () => {
    const response = await app.request(
      "https://api-staging.marblecms.com/api/auth/sign-in/email",
      {
        method: "OPTIONS",
        headers: {
          origin: env.APP_URL,
          "access-control-request-method": "POST",
          "access-control-request-headers": "content-type",
        },
      },
      env
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      env.APP_URL
    );
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true"
    );
    expect(mocks.database).not.toHaveBeenCalled();
    expect(mocks.createAuth).not.toHaveBeenCalled();
  });

  it("does not allow an unrelated dashboard origin to read auth responses", async () => {
    const response = await app.request(
      "https://api-staging.marblecms.com/api/auth/ok",
      { headers: { origin: "https://other.invalid" } },
      env
    );
    expect(response.headers.get("access-control-allow-origin")).not.toBe(
      "https://other.invalid"
    );
  });

  it("preserves permissive public CORS without creating auth", async () => {
    const response = await app.request(
      "/status",
      { headers: { origin: "https://public-client.invalid" } },
      env
    );
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.has("access-control-allow-credentials")).toBe(
      false
    );
    expect(mocks.database).not.toHaveBeenCalled();
    expect(mocks.createAuth).not.toHaveBeenCalled();
  });
});

describe("registration attribution cookies", () => {
  const productionEnv = {
    ...env,
    MODE: "production",
    AUTH_COOKIE_DOMAIN: ".marblecms.com",
  };
  const request = (body: string, bindings = productionEnv) =>
    app.request(
      "https://api.marblecms.com/api/auth/analytics/registration",
      {
        method: "POST",
        headers: {
          origin: bindings.APP_URL,
          "content-type": "application/json",
        },
        body,
      },
      bindings
    );

  it("sets the four production-only httpOnly cookies for the auth path and configured domain before the auth wildcard", async () => {
    const response = await request(
      JSON.stringify({
        marketingAnonymousId: "marketing_anon-1",
        marketingSessionId: "marketing_session-1",
        appAnonymousId: "app_anon-1",
        appSessionId: "app_session-1",
      })
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(4);
    for (const [index, name] of [
      "marble_marketing_id",
      "marble_marketing_session",
      "marble_app_id",
      "marble_app_session",
    ].entries()) {
      expect(cookies[index]).toMatch(new RegExp(`^${name}=`));
      expect(cookies[index]).toContain("Max-Age=604800");
      expect(cookies[index]).toContain("Path=/api/auth");
      expect(cookies[index]).toContain("Domain=.marblecms.com");
      expect(cookies[index]).toContain("HttpOnly");
      expect(cookies[index]).toContain("Secure");
      expect(cookies[index]).toContain("SameSite=Lax");
    }
    expect(response.headers.get("access-control-allow-origin")).toBe(
      env.APP_URL
    );
    expect(response.headers.get("access-control-allow-credentials")).toBe(
      "true"
    );
    expect(mocks.createAuth).not.toHaveBeenCalled();
    expect(mocks.database).not.toHaveBeenCalled();
  });

  it.each(["dev", "staging"])(
    "is a no-op in %s even for malformed input",
    async (MODE) => {
      const response = await request("invalid json", {
        ...productionEnv,
        MODE,
      });
      expect(response.status).toBe(204);
      expect(response.headers.getSetCookie()).toEqual([]);
      expect(mocks.createAuth).not.toHaveBeenCalled();
      expect(mocks.database).not.toHaveBeenCalled();
    }
  );

  it("uses AUTH_COOKIE_DOMAIN rather than sniffing the hostname, allowing host-only cookies", async () => {
    const response = await request(
      JSON.stringify({ appAnonymousId: "valid_ID-123" }),
      { ...productionEnv, AUTH_COOKIE_DOMAIN: "" }
    );
    expect(response.headers.getSetCookie()).toHaveLength(1);
    expect(response.headers.getSetCookie()[0]).not.toContain("Domain=");
  });

  it.each(["invalid json", "null", "42", '"text"'])(
    "rejects invalid JSON bodies (%s)",
    async (body) => {
      const response = await request(body);
      expect(response.status).toBe(400);
      expect(response.headers.getSetCookie()).toEqual([]);
    }
  );

  it.each([
    "short",
    "x".repeat(129),
    "spaces not_allowed",
    "semicolon;injected",
    "<script>invalid</script>",
    12_345_678,
    null,
  ])(
    "rejects invalid IDs without blocking registration (%s)",
    async (value) => {
      const response = await request(
        JSON.stringify({
          marketingAnonymousId: value,
          marketingSessionId: value,
          appAnonymousId: value,
          appSessionId: value,
        })
      );
      expect(response.status).toBe(204);
      expect(response.headers.getSetCookie()).toEqual([]);
    }
  );

  it("accepts the existing 8–128 character limits and ignores unknown fields", async () => {
    const response = await request(
      JSON.stringify({
        appAnonymousId: "aB0_-123",
        appSessionId: "x".repeat(128),
        unknownId: "valid_unknown-1",
      })
    );
    expect(response.headers.getSetCookie()).toHaveLength(2);
  });
});
