import type { RequestLogger } from "evlog";
import { initWorkersLogger } from "evlog/workers";

// Structured logs for Workers Logs; one wide event per request is emitted by
// the evlog() middleware. Called once at module scope.
initWorkersLogger({ env: { service: "marble-api" } });

export interface LogVariables {
  log: RequestLogger;
}
