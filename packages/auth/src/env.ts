/**
 * Configuration `createAuth` reads. The CMS builds it from `process.env`; a
 * Worker passes its bindings. Everything is optional so an unset value keeps
 * the behaviour the CMS had before: OAuth and Polar settings fall back to
 * empty strings, better-auth falls back to its own env lookup for the secret
 * and base URL, and avatars stay on the provider's URL without R2.
 */
export interface AuthEnv {
  NODE_ENV?: string;

  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  /** Dashboard origin, used to build invite links. */
  APP_URL?: string;
  /**
   * Parent domain for the session cookie (e.g. `.marblecms.com`) so the API
   * Worker on a sibling subdomain receives it. Leave unset in development,
   * where cookies are already shared across localhost ports.
   */
  AUTH_COOKIE_DOMAIN?: string;
  /**
   * Cookie name prefix (better-auth defaults to `better-auth`). Staging sets
   * its own: it shares `.marblecms.com` with production, so cookies with the
   * same name would overwrite each other.
   */
  AUTH_COOKIE_PREFIX?: string;

  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_ID?: string;
  GITHUB_SECRET?: string;

  POLAR_ACCESS_TOKEN?: string;
  /** "production" or "sandbox"; defaults from NODE_ENV. */
  POLAR_SERVER?: string;
  POLAR_WEBHOOK_SECRET?: string;
  POLAR_SUCCESS_URL?: string;
  POLAR_HOBBY_MONTHLY_PRODUCT_ID?: string;
  POLAR_HOBBY_YEARLY_PRODUCT_ID?: string;
  POLAR_PRO_MONTHLY_PRODUCT_ID?: string;
  POLAR_PRO_YEARLY_PRODUCT_ID?: string;

  /** Upstash Redis, better-auth's secondary storage for sessions. */
  REDIS_URL?: string;
  REDIS_TOKEN?: string;

  RESEND_API_KEY?: string;

  DATABUDDY_API_KEY?: string;
  /** Databuddy website ID of the dashboard. */
  DATABUDDY_CLIENT_ID?: string;
  /** Databuddy website ID of the marketing site. */
  DATABUDDY_WEB_CLIENT_ID?: string;

  /** R2 over the S3 API, used to copy OAuth avatars at sign-up. */
  CLOUDFLARE_ACCESS_KEY_ID?: string;
  CLOUDFLARE_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_BUCKET_NAME?: string;
  CLOUDFLARE_S3_ENDPOINT?: string;
  CLOUDFLARE_PUBLIC_URL?: string;
}
