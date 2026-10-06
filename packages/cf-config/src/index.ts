import { bindings, type WorkerConfig } from "cf/config";

/**
 * Settings shared by every Marble Worker. Each app's cloudflare.config.ts
 * spreads this in and adds its name and bindings.
 *
 * `satisfies` rather than `as const`: a readonly `compatibilityFlags` tuple
 * doesn't match `string[]`, which makes `defineConfig` reject the config and
 * leaves the inferred `Env` type empty.
 */
export const baseWorker = {
  compatibilityDate: "2026-05-11",
  compatibilityFlags: ["nodejs_compat"],
  entrypoint: "src/index.ts",
  placement: { mode: "smart" },
  observability: {
    logs: { enabled: true, invocationLogs: true },
    traces: { enabled: false },
  },
} satisfies Partial<WorkerConfig>;

/**
 * Omit --mode (or pass --mode production) for production, pass --mode staging
 * for the staging Workers, and pass --mode dev for local development. "dev"
 * rather than "development" so Vite's implicit default mode can never select
 * it.
 */
export type Mode = "production" | "staging" | "dev";

export function resolveMode(mode: string | undefined): Mode {
  if (mode === undefined || mode === "production") {
    return "production";
  }
  if (mode === "staging" || mode === "dev") {
    return mode;
  }
  throw new Error(
    `Unknown mode "${mode}". Pass --mode staging or --mode dev, or omit --mode for production.`
  );
}

/**
 * Production keeps the bare name. Every other mode gets a suffix, so
 * `cf deploy --mode staging` (or an accidental `--mode dev`) creates a
 * separate Worker instead of replacing production.
 */
export function workerName(name: string, mode: Mode) {
  return mode === "production" ? name : `${name}-${mode}`;
}

/**
 * Hyperdrive configs point at branches of the Neon `marble` project:
 * `production`, `staging` (branched from production) and `development`.
 */
const resources = {
  production: {
    hyperdriveId: "c0eea431cc454c9b96589cd52f70a009",
    bucket: "marblecms",
  },
  staging: {
    hyperdriveId: "cfc9cc19f6824575b36e711bcf683ef7",
    bucket: "marblestaging",
  },
  dev: {
    hyperdriveId: "d20494d3ce894268b67505bf684a2395",
    bucket: "marbledev",
  },
} as const;

/** Public URL (CDN) for each mode's bucket. */
const storagePublicUrls = {
  production: "https://cdn.marblecms.com",
  staging: "https://cdn-staging.marblecms.com",
  dev: "https://pub-c659f2325f0d4bfdb8a6c4b32626dd02.r2.dev",
} as const satisfies Record<Mode, string>;

export function storagePublicUrl(mode: Mode) {
  return storagePublicUrls[mode];
}

/**
 * The Cloudflare account that owns every Marble resource. Account IDs aren't
 * secret; R2 access needs the S3 API keys.
 */
const accountId = "3fade0cee31eae101fc646319ce3b7ef";

/** R2's S3-compatible endpoint, used to presign upload and download URLs. */
export const r2S3Endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

export function storageBucketName(mode: Mode) {
  return resources[mode].bucket;
}

const appUrls = {
  production: "https://app.marblecms.com",
  staging: "https://staging.marblecms.com",
  dev: "http://localhost:3000",
} as const satisfies Record<Mode, string>;

/** The dashboard origin each mode's Workers link and allow requests from. */
export function appUrl(mode: Mode) {
  return appUrls[mode];
}

const apiUrls = {
  production: "https://api.marblecms.com",
  staging: "https://api-staging.marblecms.com",
  dev: "http://localhost:8787",
} as const satisfies Record<Mode, string>;

/** The API Worker's origin in each mode; better-auth's baseURL. */
export function apiUrl(mode: Mode) {
  return apiUrls[mode];
}

/**
 * Hyperdrive and R2, used by api and jobs. Locally, Hyperdrive connects to
 * CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE from the app's .env.
 */
export function dataBindings(mode: Mode) {
  return {
    HYPERDRIVE: bindings.hyperdrive({ id: resources[mode].hyperdriveId }),
    STORAGE: bindings.r2({
      name: resources[mode].bucket,
      dev: { remote: mode === "dev" },
    }),
  };
}

/**
 * Queue names per mode. Every mode needs its own queues: if staging shared
 * production's, the production jobs Worker would consume staging messages
 * whose rows only exist in the staging database.
 */
export function queues(mode: Mode) {
  const suffix = mode === "production" ? "" : `-${mode}`;
  return {
    events: `marble-events${suffix}`,
    webhookDeliveries: `marble-webhook-deliveries${suffix}`,
    tasks: `marble-tasks${suffix}`,
    dlq: `marble-dlq${suffix}`,
  };
}
