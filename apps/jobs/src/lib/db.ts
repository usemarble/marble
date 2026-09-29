import { env } from "cloudflare:workers";
import {
  createHyperdriveClient,
  type HyperdriveDb,
} from "@marble/db/hyperdrive";

export type DbClient = HyperdriveDb;

/**
 * Create a Drizzle client for Cloudflare Workers via Hyperdrive.
 * Uses a per-request pg.Client (see `@marble/db/hyperdrive`).
 *
 * The client is not closed: the runtime cleans it up when the invocation ends.
 */
export async function createDbClient(): Promise<DbClient> {
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Database configuration error: no connection string available"
    );
  }
  return createHyperdriveClient(env.HYPERDRIVE.connectionString);
}
