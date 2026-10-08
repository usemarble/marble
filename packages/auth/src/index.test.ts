import type { DbClient } from "@marble/db";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuth } from "./index";
import { testEnv } from "./test-env";

const db = {} as DbClient;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Worker auth configuration", () => {
  it.each([
    ["203.0.113.42", "203.0.113.42"],
    // Better Auth normalizes IPv6 addresses to /64 by default.
    ["2001:db8::42", "2001:0db8:0000:0000:0000:0000:0000:0000"],
  ])(
    "stores the Cloudflare client IP %s when signing in",
    async (ipAddress, storedIpAddress) => {
      const auth = createAuth({ db, env: testEnv() });
      const context = await auth.$context;
      const user = {
        id: "ip-user",
        name: "IP User",
        email: "ip@staging.invalid",
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(context.internalAdapter, "findUserByEmail").mockResolvedValue({
        user,
        accounts: [
          {
            id: "ip-account",
            accountId: user.id,
            userId: user.id,
            providerId: "credential",
            password: "hashed-password",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });
      vi.spyOn(context.password, "verify").mockResolvedValue(true);
      const create = vi.spyOn(context.adapter, "create").mockResolvedValue({
        id: "ip-session",
        userId: user.id,
        token: "ip-session-token",
        ipAddress: storedIpAddress,
        userAgent: "",
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.spyOn(context.adapter, "findOne").mockResolvedValue(user);
      vi.spyOn(auth.options.secondaryStorage, "get").mockResolvedValue(null);
      vi.spyOn(auth.options.secondaryStorage, "set").mockResolvedValue();

      const response = await auth.handler(
        new Request("http://localhost:8787/api/auth/sign-in/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "http://localhost:3000",
            "cf-connecting-ip": ipAddress,
            "x-forwarded-for": "198.51.100.10",
          },
          body: JSON.stringify({
            email: user.email,
            password: "correct-horse-battery",
          }),
        })
      );

      expect(response.status).toBe(200);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "session",
          data: expect.objectContaining({
            ipAddress: storedIpAddress,
            userId: user.id,
          }),
        })
      );
    }
  );

  it("handles the default auth path without a database query", async () => {
    const auth = createAuth({ db, env: testEnv() });
    const response = await auth.handler(
      new Request("http://localhost:8787/api/auth/ok")
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("shares staging cookies with the dashboard without using production names", async () => {
    const auth = createAuth({
      db,
      env: testEnv({
        MODE: "staging",
        BETTER_AUTH_URL: "https://api-staging.marblecms.com",
        APP_URL: "https://staging.marblecms.com",
        AUTH_COOKIE_DOMAIN: ".marblecms.com",
        AUTH_COOKIE_PREFIX: "marble-staging",
      }),
    });
    const context = await auth.$context;
    expect(context.authCookies.sessionToken).toMatchObject({
      name: "__Secure-marble-staging.session_token",
      attributes: {
        domain: ".marblecms.com",
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      },
    });
    expect(context.trustedOrigins).toContain("https://staging.marblecms.com");
    expect(context.trustedOrigins).not.toContain("https://app.marblecms.com");
    expect(auth.options.plugins[0]?.id).toBe("polar");
  });

  it("keeps localhost cookies usable across ports", async () => {
    const context = await createAuth({ db, env: testEnv() }).$context;
    expect(context.authCookies.sessionToken).toMatchObject({
      name: "marble-dev.session_token",
      attributes: { sameSite: "lax", secure: false },
    });
    expect(context.authCookies.sessionToken.attributes.domain).toBeUndefined();
    expect(context.trustedOrigins).toContain("http://localhost:3000");
  });

  it("updates copied avatars through Better Auth so cached sessions refresh", async () => {
    const auth = createAuth({ db, env: testEnv() });
    const context = await auth.$context;
    const user = {
      id: "avatar-user",
      name: "Avatar User",
      email: "avatar@staging.invalid",
      emailVerified: false,
      image: "https://avatars.githubusercontent.com/u/123",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updateUser = vi
      .spyOn(context.internalAdapter, "updateUser")
      .mockResolvedValue(user);
    vi.spyOn(auth.api, "createOrganization").mockResolvedValue({
      id: "personal-workspace",
      name: "Personal",
      slug: "personal-workspace",
      createdAt: new Date(),
      metadata: null,
      members: [],
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("avatar", {
          headers: { "content-type": "image/png" },
        })
      )
    );
    await auth.options.databaseHooks.user.create.after(user, null);
    expect(updateUser).toHaveBeenCalledWith(user.id, {
      image: expect.stringMatching(
        /^https:\/\/cdn-test.marblecms.com\/avatars\/avatar-user\//
      ),
    });
  });
});
