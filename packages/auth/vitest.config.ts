import { defineConfig } from "vitest/config";

// Tests that need Postgres create a database and migrate it in beforeAll.
export default defineConfig({
  test: { hookTimeout: 30_000, testTimeout: 15_000 },
});
