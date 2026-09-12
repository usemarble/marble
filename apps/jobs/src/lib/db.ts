import {
  closeHyperdriveClient,
  createHyperdriveClient,
  type HyperdriveDb,
} from "@marble/db/hyperdrive";
import type { Env } from "@/types/env";

export type DbClient = HyperdriveDb;

/**
 * Create a Drizzle client for Cloudflare Workers via Hyperdrive.
 * Uses a per-request pg.Client (see `@marble/db/hyperdrive`).
 *
 * Every call must be paired with `closeDbClient` in a `finally`.
 */
export async function createDbClient(env: Env): Promise<DbClient> {
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Database configuration error: no connection string available"
    );
  }
  return createHyperdriveClient(env.HYPERDRIVE.connectionString);
}

/** Releases the connection behind `db`. Idempotent and never throws. */
export async function closeDbClient(db: DbClient): Promise<void> {
  return closeHyperdriveClient(db);
}
