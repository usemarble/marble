import {
  createHyperdriveClient,
  type HyperdriveDb,
} from "@marble/db/hyperdrive";
import { createMiddleware } from "hono/factory";
import type { Env } from "@/types/env";

export type DbClient = HyperdriveDb;

/**
 * Create a Drizzle client for Cloudflare Workers via Hyperdrive.
 * Uses a per-request pg.Client (see `@marble/db/hyperdrive`); CMS uses
 * the neon-serverless WebSocket client from `@marble/db`.
 *
 * The client is not closed: the runtime cleans it up when the invocation ends,
 * so `waitUntil` work after the response can keep using it.
 */
export async function createDbClient(env: Env): Promise<DbClient> {
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Database configuration error: no connection string available"
    );
  }
  return createHyperdriveClient(env.HYPERDRIVE.connectionString);
}

export interface DbVariables {
  db: DbClient;
}

export const dbMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: DbVariables;
}>(async (c, next) => {
  let db: DbClient;
  try {
    db = await createDbClient(c.env);
  } catch (error) {
    console.error("[DB] Database configuration error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }

  c.set("db", db);
  await next();
});
