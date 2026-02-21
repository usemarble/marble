import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Create a Prisma client for Hyperdrive.
 *
 * Uses the pg-worker adapter (standard PostgreSQL protocol) instead of the Neon
 * serverless driver. Compatible with Cloudflare Hyperdrive, which requires
 * direct TCP Postgres connections per CF docs.
 *
 * Pass env.HYPERDRIVE.connectionString from your Worker. Same Prisma Client
 * API for all queries — no schema changes needed.
 */
const createClient = (connectionString: string) => {
  const url =
    typeof connectionString === "string"
      ? connectionString.trim()
      : String(connectionString || "").trim();

  if (!url) {
    throw new Error("Connection string is required and must be non-empty");
  }

  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
};

export { createClient };
