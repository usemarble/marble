import { defineConfig } from "drizzle-kit";

/**
 * Local / staging inspection only.
 *
 * Prisma remains the schema owner. Do NOT run drizzle-kit generate or migrate
 * against production. Prefer drizzle-kit pull on a staging clone first.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
