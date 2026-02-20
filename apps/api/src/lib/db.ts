import type { Env } from "../types/env";

/**
 * Get the database connection string.
 * In development, uses DATABASE_URL directly to bypass Hyperdrive's local proxy
 * (which can have compatibility issues with Neon's serverless driver).
 * In production, uses Hyperdrive for connection pooling and latency optimization.
 */
export function getConnectionString(env: Env): string {
  if (env.ENVIRONMENT === "development" && env.DATABASE_URL) {
    return env.DATABASE_URL;
  }
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error(
      "Database configuration error: no connection string available"
    );
  }
  return env.HYPERDRIVE.connectionString;
}
