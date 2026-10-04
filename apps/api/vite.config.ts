import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import jobsConfig from "../jobs/cloudflare.config.ts";

// `pnpm workers:dev` sets this to run the jobs Worker in the same local
// session, so messages api sends to a queue reach the jobs consumer.
const withJobs = process.env.MARBLE_DEV_WITH_JOBS === "1";

export default defineConfig(({ mode }) => ({
  resolve: { tsconfigPaths: true },
  build: { minify: true },
  // The Worker answers CORS itself (credentialed for the dashboard origin).
  // Vite's own CORS middleware would answer preflights first, without
  // Access-Control-Allow-Credentials.
  server: {
    port: 8787,
    cors: false,
    // Quick tunnels (cloudflared) for testing Polar webhooks locally.
    allowedHosts: ["localhost", ".trycloudflare.com"],
  },
  plugins: [
    cloudflare({
      auxiliaryWorkers: withJobs
        ? [
            {
              config: {
                ...jobsConfig({ mode, isPreview: false }).worker,
                entrypoint: "../jobs/src/index.ts",
              },
              devOnly: true,
            },
          ]
        : [],
      persistState: { path: "../../.cloudflare/state" },
    }),
  ],
}));
