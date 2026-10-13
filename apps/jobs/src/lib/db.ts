import { env } from "cloudflare:workers";
import {
  createHyperdriveClient,
  type HyperdriveDb,
} from "@marble/db/hyperdrive";

export type DbClient = HyperdriveDb;
export type DbTransaction = Parameters<
  Parameters<DbClient["transaction"]>[0]
>[0];
export type DbSession = DbClient | DbTransaction;

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
