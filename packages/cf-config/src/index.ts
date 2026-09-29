import type { WorkerConfig } from "cf/config";

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
