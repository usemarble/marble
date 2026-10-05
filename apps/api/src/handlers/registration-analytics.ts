import type { Handler } from "hono";
import { setCookie } from "hono/cookie";
import type { Env } from "../types/env";

const IDS = {
  marketingAnonymousId: "marble_marketing_id",
  marketingSessionId: "marble_marketing_session",
  appAnonymousId: "marble_app_id",
  appSessionId: "marble_app_session",
} as const;

/** Attribution cookies must reach Better Auth's subsequent sign-up request. */
export const registrationAnalytics: Handler<{
  Bindings: Pick<Env, "MODE" | "AUTH_COOKIE_DOMAIN">;
}> = async (c) => {
  if (c.env.MODE !== "production") {
    return c.body(null, 204);
  }

  const body: unknown = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return c.body(null, 400);
  }

  for (const [field, name] of Object.entries(IDS)) {
    const value = Reflect.get(body, field);
    if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(value)) {
      continue;
    }
    setCookie(c, name, value, {
      httpOnly: true,
      secure: new URL(c.req.url).protocol === "https:",
      sameSite: "lax",
      path: "/api/auth",
      ...(c.env.AUTH_COOKIE_DOMAIN && { domain: c.env.AUTH_COOKIE_DOMAIN }),
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return c.body(null, 204);
};
