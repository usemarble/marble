import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { schema } from "./schema";

/**
 * Hyperdrive client for api/jobs Workers. Uses a per-request pg.Client (not Pool).
 * CMS must use the neon-serverless WebSocket client from `./index.ts`.
 */
export type HyperdriveDb = NodePgDatabase<typeof schema>;

/**
 * Each db carries a dedicated socket, so every `createHyperdriveClient` call must
 * be paired with `closeHyperdriveClient` (in a `finally`) or the Worker leaks
 * Hyperdrive/Postgres connections until the runtime tears the isolate down.
 */
const openClients = new WeakMap<HyperdriveDb, Client>();

export const createHyperdriveClient = async (
  connectionString: string
): Promise<HyperdriveDb> => {
  const client = new Client({ connectionString });
  await client.connect();
  const db = drizzle({ client, schema });
  openClients.set(db, client);
  return db;
};

/**
 * Closes the socket behind `db`. Idempotent, and never throws — a failed close
 * must not mask the error that sent us down the cleanup path.
 */
export const closeHyperdriveClient = async (
  db: HyperdriveDb
): Promise<void> => {
  const client = openClients.get(db);
  if (!client) {
    return;
  }
  openClients.delete(db);
  try {
    await client.end();
  } catch (error) {
    console.error("[DB] Failed to close Hyperdrive client:", error);
  }
};
