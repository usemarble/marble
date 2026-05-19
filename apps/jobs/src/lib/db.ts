import { createClient } from "@marble/db/hyperdrive";
import type { Env } from "../types/env";

export type DbClient = ReturnType<typeof createDbClient>;

export function createDbClient(env: Env) {
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Database configuration error: no connection string available"
    );
  }
  return createClient(env.HYPERDRIVE.connectionString);
}
