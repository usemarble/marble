import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    published: z.string(),
    description: z.string(),
    lastUpdated: z.string(),
    tags: z.array(z.string()),
    cover: z.string().optional(),
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
