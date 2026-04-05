import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prefer a direct URL for CLI operations when available, but keep
    // DATABASE_URL as a fallback so local generate/build flows stay simple.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
