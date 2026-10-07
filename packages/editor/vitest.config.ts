import { defineConfig } from "vitest/config";

// react-tweet imports CSS modules from its own dist, which Node can't load.
// Let Vite process it like app code instead.
export default defineConfig({
  test: { server: { deps: { inline: ["react-tweet"] } } },
});
