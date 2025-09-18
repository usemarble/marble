import { defineCollection, z } from "astro:content";
import { highlightContent } from "./lib/highlight";

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
  updatedAt: z.coerce.date(),
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
    const response = await fetch(`${url}/${key}/posts?exclude=legal`);
    const data = await response.json();
    const posts = data.posts as Post[];
    // Must return an array of entries with an id property
    // or an object with IDs as keys and entries as values
    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        content: await highlightContent(post.content),
      })),
    );
  },
  schema: postSchema,
});

const page = defineCollection({
  loader: async () => {
    const response = await fetch(`${url}/${key}/posts?category=legal`);
    const data = await response.json();
    const posts = data.posts as Post[];

    return posts.map((post) => ({
      ...post,
      // Astro uses the id as a key to get the entry
      // We can't know the id of the post so we use the slug
      id: post.slug,
    }));
  },
  schema: postSchema,
});

export const collections = { posts: articleCollection, page };
