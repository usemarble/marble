import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import type { HyperdriveDb } from "./hyperdrive";
import { schema } from "./schema";

/**
 * The Postgres in the root docker-compose.yml. Tests create their own database
 * on it rather than touching `marble`.
 */
const SERVER_URL =
  process.env.TEST_POSTGRES_URL ??
  "postgresql://usemarble:justusemarble@localhost:5432/postgres";

// A string, not a URL: Workers projects (apps/jobs) typecheck this file with a
// global URL that Node's fileURLToPath types don't accept.
const MIGRATIONS_FOLDER = fileURLToPath(
  new URL("../drizzle", import.meta.url).href
);

export interface TestDatabase {
  db: HyperdriveDb;
  /** Ends the connection and drops the database. */
  close(): Promise<void>;
}

/**
 * Creates a throwaway database, applies every migration to it and connects.
 * Call it from `beforeAll` and `close()` from `afterAll`; each test file gets
 * its own database, so files can run in parallel.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const name = `marble_test_${randomBytes(6).toString("hex")}`;

  const admin = new Client({ connectionString: SERVER_URL });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${name}`);

  const url = new URL(SERVER_URL);
  url.pathname = `/${name}`;
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  const db = drizzle({ client, schema });

  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } catch (error) {
    await client.end();
    await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
    await admin.end();
    throw error;
  }

  return {
    db,
    async close() {
      await client.end();
      await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
      await admin.end();
    },
  };
}
