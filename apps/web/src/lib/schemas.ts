import { z } from "astro:content";

export const paginationSchema = z.object({
  limit: z.number(),
  currentPage: z.number(),
  nextPage: z.number().nullable(),
  previousPage: z.number().nullable(),
  totalPages: z.number(),
  totalItems: z.number(),
});

// Main Post schema for single post retrieval (full data)
export const postSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  description: z.string(),
  coverImage: z.string().url().nullable().optional(),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  authors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      image: z.string().url().nullable().optional(),
      bio: z.string().nullable(),
      role: z.string().nullable(),
      slug: z.string(),
      socials: z.array(
        z.object({
          url: z.string().url(),
          platform: z.string(),
        })
      ),
    })
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
    })
  ),
  attribution: z
    .object({
      author: z.string(),
      url: z.string().url(),
    })
    .nullable(),
});
export type Post = z.infer<typeof postSchema>;

export const postsSchema = z.object({
  posts: z.array(postSchema),
  pagination: paginationSchema,
});
export type Posts = z.infer<typeof postsSchema>;

export const categoryPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  coverImage: z.string().url().nullable().optional(),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  content: z.string(),
  authors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      image: z.string().url().nullable().optional(),
    })
  ),
  tags: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
  ),
  category: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
});
export type CategoryPost = z.infer<typeof categoryPostSchema>;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  count: z.object({
    posts: z.number(),
  }),
});
export type Category = z.infer<typeof categorySchema>;
