import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const key = import.meta.env.MARBLE_WORKSPACE_KEY;
const url = import.meta.env.MARBLE_API_URL;

const postSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  description: z.string(),
  coverImage: z.string().url(),
  publishedAt: z.coerce.date(),
  authors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      image: z.string().url(),
    }),
  ),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    }),
  ),
  attribution: z
    .object({
      author: z.string(),
      url: z.string().url(),
    })
    .nullable(),
});
type Post = z.infer<typeof postSchema>;

const articleCollection = defineCollection({
  loader: async () => {
    const response = await fetch(`${url}/${key}/posts`);
    const data = await response.json();
    const posts = data.posts as Post[];
    // Must return an array of entries with an id property
    // or an object with IDs as keys and entries as values
    return posts.map((post) => ({
      ...post,
    }));
  },
  schema: postSchema,
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

export const collections = { posts: articleCollection, page };
