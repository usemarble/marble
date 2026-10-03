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
