import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { schema } from "./schema";

/**
 * Placeholder Hyperdrive / node-postgres client factory for PR2 (api/jobs).
 *
 * CMS must use the neon-serverless WebSocket client from `@marble/drizzle`
 * (see `./index.ts`). This export mirrors `@marble/db/hyperdrive` for the
 * Workers cutover and is intentionally minimal until that PR lands.
 */
export const createHyperdriveClient = (connectionString: string) => {
  const url =
    typeof connectionString === "string"
      ? connectionString.trim()
      : String(connectionString || "").trim();

  if (!url) {
    throw new Error("Connection string is required and must be non-empty");
  }

  const pool = new Pool({ connectionString: url });
  return drizzle({ client: pool, schema });
};
