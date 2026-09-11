import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { schema } from "./schema";

/**
 * Hyperdrive client for api/jobs Workers. Uses a per-request pg.Client (not Pool).
 * CMS must use the neon-serverless WebSocket client from `./index.ts`.
 */
export type HyperdriveDb = NodePgDatabase<typeof schema>;

export const createHyperdriveClient = async (
  connectionString: string
): Promise<HyperdriveDb> => {
  const client = new Client({ connectionString });
  await client.connect();
  return drizzle({ client, schema });
};
