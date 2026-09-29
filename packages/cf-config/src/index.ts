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
 * Omit --mode (or pass --mode production) for production, and pass
 * --mode dev for local development. "dev" rather than "development" so
 * Vite's implicit default mode can never select it.
 */
export type Mode = "production" | "dev";

export function resolveMode(mode: string | undefined): Mode {
  if (mode === undefined || mode === "production") {
    return "production";
  }
  if (mode === "dev") {
    return "dev";
  }
  throw new Error(
    `Unknown mode "${mode}". Pass --mode dev, or omit --mode for production.`
  );
}

/**
 * Dev gets its own Worker name so an accidental `cf deploy --mode dev`
 * creates a separate Worker instead of replacing production.
 */
export function workerName(name: string, mode: Mode) {
  return mode === "dev" ? `${name}-dev` : name;
}

const resources = {
  production: {
    hyperdriveId: "c0eea431cc454c9b96589cd52f70a009",
    bucket: "marblecms",
  },
  dev: {
    hyperdriveId: "d20494d3ce894268b67505bf684a2395",
    bucket: "marbledev",
  },
} as const;

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

export const queues = {
  events: "marble-events",
  webhookDeliveries: "marble-webhook-deliveries",
  tasks: "marble-tasks",
  dlq: "marble-dlq",
} as const;
