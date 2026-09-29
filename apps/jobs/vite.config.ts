import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  build: { minify: true },
  plugins: [cloudflare({ persistState: { path: "../../.cloudflare/state" } })],
});
