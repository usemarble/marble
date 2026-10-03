import type { R2HTTPMetadata } from "@cloudflare/workers-types";

/** The bindings required by the per-invocation auth factory. */
export interface AuthEnv {
  MODE: "production" | "staging" | "dev";
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  APP_URL: string;
  AUTH_COOKIE_DOMAIN: string;
  AUTH_COOKIE_PREFIX: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_ID: string;
  GITHUB_SECRET: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SERVER: "production" | "sandbox";
  POLAR_WEBHOOK_SECRET: string;
  POLAR_SUCCESS_URL: string;
  POLAR_HOBBY_MONTHLY_PRODUCT_ID: string;
  POLAR_HOBBY_YEARLY_PRODUCT_ID: string;
  POLAR_PRO_MONTHLY_PRODUCT_ID: string;
  POLAR_PRO_YEARLY_PRODUCT_ID: string;
  REDIS_URL: string;
  REDIS_TOKEN: string;
  RESEND_API_KEY: string;
  DATABUDDY_API_KEY: string;
  DATABUDDY_CLIENT_ID: string;
  DATABUDDY_WEB_CLIENT_ID: string;
  STORAGE: {
    put(
      key: string,
      value: ArrayBuffer,
      options: { httpMetadata: Pick<R2HTTPMetadata, "contentType"> }
    ): Promise<unknown>;
  };
  STORAGE_PUBLIC_URL: string;
}
