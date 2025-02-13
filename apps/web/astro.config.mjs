// @ts-check
import { defineConfig } from "astro/config";

import tailwind from "@astrojs/tailwind";

import mdx from "@astrojs/mdx";

import vercel from "@astrojs/vercel";

import sitemap from "@astrojs/sitemap";

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