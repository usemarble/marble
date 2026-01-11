import { z } from "@hono/zod-openapi";
import { PaginationSchema } from "./common";

export const SocialRefSchema = z
  .object({
    url: z.url().openapi({ example: "https://twitter.com/johndoe" }),
    platform: z.string().openapi({ example: "twitter" }),
  })
  .openapi("SocialRef");

export const AuthorRefSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp1234jl04vdnycek8" }),
    name: z.string().openapi({ example: "John Doe" }),
    image: z
      .string()
      .nullable()
      .openapi({ example: "https://media.marblecms.com/avatar.jpg" }),
    bio: z
      .string()
      .nullable()
      .openapi({ example: "Technical writer and developer" }),
    role: z.string().nullable().openapi({ example: "Editor" }),
    slug: z.string().openapi({ example: "john-doe" }),
    socials: z.array(SocialRefSchema),
  })
  .openapi("AuthorRef");

export const CategoryRefSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp1234jl04vdnycek8" }),
    name: z.string().openapi({ example: "Technology" }),
    slug: z.string().openapi({ example: "technology" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "Tech news and tutorials" }),
  })
  .openapi("CategoryRef");

export const TagRefSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp1234jl04vdnycek8" }),
    name: z.string().openapi({ example: "JavaScript" }),
    slug: z.string().openapi({ example: "javascript" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "JavaScript tutorials" }),
  })
  .openapi("TagRef");

export const PostSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp5678mn09qrstuvwx" }),
    slug: z.string().openapi({ example: "getting-started-with-nextjs" }),
    title: z.string().openapi({ example: "Getting Started with Next.js" }),
    content: z.string().openapi({ example: "<p>Hello world</p>" }),
    featured: z.boolean().openapi({ example: false }),
    coverImage: z
      .string()
      .nullable()
      .openapi({ example: "https://media.marblecms.com/cover.jpg" }),
    description: z
      .string()
      .openapi({ example: "A beginner's guide to Next.js" }),
    publishedAt: z.iso.datetime().openapi({ example: "2024-01-15T10:00:00Z" }),
    updatedAt: z.iso.datetime().openapi({ example: "2024-01-16T12:00:00Z" }),
    attribution: z
      .object({
        author: z.string().openapi({ example: "John Doe" }),
        url: z
          .url()
          .openapi({ example: "https://original-source.com/article" }),
      })
      .nullable()
      .openapi({
        description:
          "Attribution to the original author when republishing content",
      }),
    authors: z.array(AuthorRefSchema),
    category: CategoryRefSchema,
    tags: z.array(TagRefSchema),
  })
  .openapi("Post");

export const PostsListResponseSchema = z
  .object({
    posts: z.array(PostSchema),
    pagination: PaginationSchema,
  })
  .openapi("PostsListResponse");

export const PostResponseSchema = z
  .object({
    post: PostSchema,
  })
  .openapi("PostResponse");
