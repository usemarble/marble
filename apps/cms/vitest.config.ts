import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  esbuild: { jsx: "automatic" },
  // The public values src/env.ts requires; tests override them with stubEnv.
  test: {
    env: {
      NEXT_PUBLIC_API_URL: "http://localhost:8787",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  },
});
