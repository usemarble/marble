import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string(),
      published: z.string(),
      description: z.string(),
      lastUpdated: z.string(),
      tags: z.array(z.string()),
      cover: z.object({
        src: image(),
        alt: z.string(),
      }),
    }),
});

const page = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    published: z.date(),
    description: z.string(),
    lastUpdated: z.date(),
  }),
});

export const collections = { blog, page };
