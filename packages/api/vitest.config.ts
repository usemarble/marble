import { defineConfig } from "vitest/config";

// Tests run against the docker-compose Postgres and Redis; each file migrates
// its own throwaway database in beforeAll.
export default defineConfig({
  test: { hookTimeout: 30_000, testTimeout: 15_000 },
});
