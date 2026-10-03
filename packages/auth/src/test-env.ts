import { vi } from "vitest";
import type { AuthEnv } from "./env";

export function testEnv(overrides: Partial<AuthEnv> = {}): AuthEnv {
  return {
    MODE: "dev",
    BETTER_AUTH_SECRET: "local-auth-test-secret-at-least-32-characters",
    BETTER_AUTH_URL: "http://localhost:8787",
    APP_URL: "http://localhost:3000",
    AUTH_COOKIE_DOMAIN: "",
    AUTH_COOKIE_PREFIX: "marble-dev",
    GOOGLE_CLIENT_ID: "google-test-id",
    GOOGLE_CLIENT_SECRET: "google-test-secret",
    GITHUB_ID: "github-test-id",
    GITHUB_SECRET: "github-test-secret",
    POLAR_ACCESS_TOKEN: "polar-test-token",
    POLAR_SERVER: "sandbox",
    POLAR_WEBHOOK_SECRET: "polar-test-webhook-secret",
    POLAR_SUCCESS_URL: "http://localhost:3000/?checkout_id={CHECKOUT_ID}",
    POLAR_HOBBY_MONTHLY_PRODUCT_ID: "hobby-monthly",
    POLAR_HOBBY_YEARLY_PRODUCT_ID: "hobby-yearly",
    POLAR_PRO_MONTHLY_PRODUCT_ID: "pro-monthly",
    POLAR_PRO_YEARLY_PRODUCT_ID: "pro-yearly",
    REDIS_URL: "http://localhost:8079",
    REDIS_TOKEN: "redis-test-token",
    RESEND_API_KEY: "resend-test-key",
    DATABUDDY_API_KEY: "",
    DATABUDDY_CLIENT_ID: "",
    DATABUDDY_WEB_CLIENT_ID: "",
    STORAGE: { put: vi.fn().mockResolvedValue(null) },
    STORAGE_PUBLIC_URL: "https://cdn-test.marblecms.com",
    ...overrides,
  };
}
