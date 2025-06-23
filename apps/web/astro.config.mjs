// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx(), sitemap()],
  site: "https://marblecms.com",
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
