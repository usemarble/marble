import { createClient as createHyperdriveClient } from "@marble/db/hyperdrive";
import { createClient as createWorkersClient } from "@marble/db/workers";
import type { Env } from "../types/env";

/**
 * Get the database connection string.
 * In development, uses DATABASE_URL directly to bypass Hyperdrive's local proxy
 * (which can have compatibility issues with Neon's serverless driver).
 * In production, uses Hyperdrive for connection pooling and latency optimization.
 */
export function getConnectionString(env: Env): string {
  // if (env.ENVIRONMENT === "development" && env.DATABASE_URL) {
  //   return env.DATABASE_URL;
  // }
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Database configuration error: no connection string available"
    );
  }
  return env.HYPERDRIVE.connectionString;
}

/**
 * Create a Prisma client with the correct adapter for the current env.
 * - DATABASE_URL (dev or BYPASS_HYPERDRIVE): Neon serverless driver
 * - HYPERDRIVE: pg-worker driver (standard Postgres, Hyperdrive-compatible)
 */
export type DbClient = ReturnType<typeof createDbClient>;

export function createDbClient(env: Env) {
  // const useDirect = env.ENVIRONMENT === "development";
  // if (useDirect && env.DATABASE_URL) {
  //   return createWorkersClient(env.DATABASE_URL);
  // }
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Database configuration error: no connection string available"
    );
  }
  return createHyperdriveClient(env.HYPERDRIVE.connectionString);
}
