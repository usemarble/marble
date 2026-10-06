import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Keeps unit tests separate from vite.config.ts and its Cloudflare plugin.
// Vitest 3 uses Vite 7, which needs this explicit alias for app imports.
// Tests that need Postgres create a database and migrate it in beforeAll.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: { hookTimeout: 30_000, testTimeout: 15_000 },
});
