import { z } from "@hono/zod-openapi";
import { PaginationSchema } from "./common";

// ============================================
// Embedded References (for Post responses)
// ============================================
export const SocialRefSchema = z
  .object({
    url: z.string().url().openapi({ example: "https://twitter.com/johndoe" }),
    platform: z.string().openapi({ example: "twitter" }),
  })
  .openapi("SocialRef");

export const AuthorRefSchema = z
  .object({
    id: z.string().openapi({ example: "clx123abc" }),
    name: z.string().openapi({ example: "John Doe" }),
    image: z
      .string()
      .nullable()
      .openapi({ example: "https://cdn.example.com/avatar.jpg" }),
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
    id: z.string().openapi({ example: "clx456def" }),
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
    id: z.string().openapi({ example: "clx789ghi" }),
    name: z.string().openapi({ example: "JavaScript" }),
    slug: z.string().openapi({ example: "javascript" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "JavaScript tutorials" }),
  })
  .openapi("TagRef");

// ============================================
// Post Schema
// ============================================
export const PostSchema = z
  .object({
    id: z.string().openapi({ example: "clx000post" }),
    slug: z.string().openapi({ example: "getting-started-with-nextjs" }),
    title: z.string().openapi({ example: "Getting Started with Next.js" }),
    content: z.string().nullable().openapi({ example: "<p>Hello world</p>" }),
    featured: z.boolean().openapi({ example: false }),
    coverImage: z
      .string()
      .nullable()
      .openapi({ example: "https://cdn.example.com/cover.jpg" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "A beginner's guide to Next.js" }),
    publishedAt: z
      .string()
      .datetime()
      .nullable()
      .openapi({ example: "2024-01-15T10:00:00Z" }),
    updatedAt: z
      .string()
      .datetime()
      .openapi({ example: "2024-01-16T12:00:00Z" }),
    attribution: z
      .string()
      .nullable()
      .openapi({ example: "Photo by Unsplash" }),
    authors: z.array(AuthorRefSchema),
    category: CategoryRefSchema.nullable(),
    tags: z.array(TagRefSchema),
  })
  .openapi("Post");

// ============================================
// Response Schemas
// ============================================
export const PostsListResponseSchema = z
  .object({
    posts: z.array(PostSchema),
    pagination: PaginationSchema,
  })
  .openapi("PostsListResponse");

export const SinglePostResponseSchema = z
  .object({
    post: PostSchema,
  })
  .openapi("SinglePostResponse");
