import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

// Static files in public/ are served as Worker assets (Vite's default publicDir).
export default defineConfig({
  resolve: { tsconfigPaths: true },
  build: { minify: true },
  server: { port: 8787 },
  plugins: [cloudflare()],
});
