import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Keeps unit tests separate from vite.config.ts and its Cloudflare plugin.
// Vitest 3 uses Vite 7, which needs this explicit alias for app imports.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
