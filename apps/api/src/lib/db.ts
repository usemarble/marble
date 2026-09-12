import {
  closeHyperdriveClient,
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
  try {
    await next();
  } finally {
    // Release the socket once the response is on its way, not before it.
    // Awaiting client.end() inline puts a teardown round trip on the critical
    // path of every request; waitUntil keeps the isolate alive for the close
    // without delaying the response.
    //
    // Hono's executionCtx getter throws when there is no execution context
    // (unit tests, app.request()), and `c.executionCtx?.` does not help — the
    // getter throws before the optional chain can apply — so this falls back
    // to closing inline. closeDbClient is idempotent either way.
    try {
      c.executionCtx.waitUntil(closeDbClient(db));
    } catch {
      await closeDbClient(db);
    }
  }
});
