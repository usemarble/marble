import type { RequestLogger } from "evlog";
import { initWorkersLogger } from "evlog/workers";

// Structured logs for Workers Logs; one wide event per request is emitted by
// the evlog() middleware. Called once at module scope, so index.ts imports this
// file for its side effect. MODE is a text binding, which nodejs_compat exposes
// on process.env.
initWorkersLogger({
  env: { service: "marble-api", environment: process.env.MODE ?? "production" },
});

export interface LogVariables {
  log: RequestLogger;
}
