import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
// Drizzle relational queries require the full schema object.
// biome-ignore lint/performance/noNamespaceImport: pass schema map to drizzle()
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const createClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || typeof connectionString !== "string") {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });
  return drizzle({ client: pool, schema });
};

type DrizzleDb = ReturnType<typeof createClient>;

declare global {
  var drizzleDb: DrizzleDb | undefined;
}

let db: DrizzleDb;

if (process.env.NODE_ENV === "production") {
  db = createClient();
} else {
  if (!global.drizzleDb) {
    global.drizzleDb = createClient();
  }
  db = global.drizzleDb;
}

export { db };
export type { DrizzleDb };
