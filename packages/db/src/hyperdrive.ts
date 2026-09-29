import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { schema } from "./schema";

/**
 * Hyperdrive client for api/jobs Workers. Uses a per-request pg.Client (not Pool).
 * CMS must use the neon-serverless WebSocket client from `./index.ts`.
 */
export type HyperdriveDb = NodePgDatabase<typeof schema>;

/**
 * Opens a pg.Client for one Worker invocation. Do not close it: the Workers
 * runtime cleans up Worker-to-Hyperdrive connections when the invocation ends,
 * after any `waitUntil` work, and Hyperdrive only holds an origin connection
 * for the length of each query or transaction. Closing it early kills queries
 * that background tasks are still running. Create a new client per invocation;
 * a client cannot be reused across requests.
 */
export const createHyperdriveClient = async (
  connectionString: string
): Promise<HyperdriveDb> => {
  const client = new Client({ connectionString });
  await client.connect();
  return drizzle({ client, schema });
};
