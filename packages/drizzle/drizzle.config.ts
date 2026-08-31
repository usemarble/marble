import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * `schema` → ./src/schema/ (source of truth)
 * `out` → ./drizzle (migrations land here once Drizzle owns them)
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
