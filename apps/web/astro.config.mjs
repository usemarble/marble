// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import tailwind from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwind()],
  },
  site: "https://marblecms.com",
  trailingSlash: "never",
  image: {
    domains: ["images.marblecms.com"],
  },
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    isr: {
      expiration: 3600,
      exclude: [/^\/(?!contributors\/?$).*/],
    },
  }),
  experimental: {
    fonts: [
      {
        name: "Literata",
        cssVariable: "--font-literata",
        provider: fontProviders.fontsource(),
        weights: [400, 500, 600, 700],
        styles: ["normal"],
        subsets: ["latin"],
      },
      {
        name: "Geist",
        cssVariable: "--font-geist",
        provider: fontProviders.google(),
        weights: [400, 500, 600, 700],
        styles: ["normal"],
        subsets: ["latin"],
      },
    ],
    svgo: true,
  },
});
