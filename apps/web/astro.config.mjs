// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@tailwindcss/vite";

import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwind()],
  },
  site: "https://marblecms.com",
  image: {
    domains: ["images.marblecms.com"],
  },
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
