import {
  createHyperdriveClient,
  type HyperdriveDb,
} from "@marble/drizzle/hyperdrive";
import { createMiddleware } from "hono/factory";
import type { Env } from "@/types/env";

export type DbClient = HyperdriveDb;

/**
 * Create a Drizzle client for Cloudflare Workers via Hyperdrive.
 * Uses a per-request pg.Client (see `@marble/drizzle/hyperdrive`); CMS uses
 * the neon-serverless WebSocket client from `@marble/drizzle`.
 */
export async function createDbClient(env: Env): Promise<DbClient> {
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Database configuration error: no connection string available"
    );
  }
  return createHyperdriveClient(env.HYPERDRIVE.connectionString);
}

export type DbVariables = {
  db: DbClient;
};

export const dbMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: DbVariables;
}>(async (c, next) => {
  try {
    c.set("db", await createDbClient(c.env));
  } catch (error) {
    console.error("[DB] Database configuration error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
  await next();
});
