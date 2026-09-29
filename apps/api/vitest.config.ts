import { defineConfig } from "vitest/config";

// Keeps Vitest from loading vite.config.ts and its Cloudflare plugin.
export default defineConfig({
  resolve: { tsconfigPaths: true },
});
