import { z } from "@hono/zod-openapi";
import { PaginationSchema } from "./common";

// ============================================
// Social Schema
// ============================================
export const SocialSchema = z
  .object({
    url: z.url().openapi({ example: "https://twitter.com/johndoe" }),
    platform: z.string().openapi({ example: "twitter" }),
  })
  .openapi("Social");

// ============================================
// Author Schema
// ============================================
export const AuthorSchema = z
  .object({
    id: z.string().openapi({ example: "clx123abc" }),
    name: z.string().openapi({ example: "John Doe" }),
    image: z
      .string()
      .nullable()
      .openapi({ example: "https://cdn.example.com/avatar.jpg" }),
    slug: z.string().openapi({ example: "john-doe" }),
    bio: z
      .string()
      .nullable()
      .openapi({ example: "Technical writer and developer" }),
    role: z.string().nullable().openapi({ example: "Editor" }),
    socials: z.array(SocialSchema),
    count: z
      .object({
        posts: z.number().int().openapi({ example: 12 }),
      })
      .optional()
      .openapi({ description: "Number of published posts by this author" }),
  })
  .openapi("Author");

// ============================================
// Response Schemas
// ============================================
export const AuthorsListResponseSchema = z
  .object({
    authors: z.array(AuthorSchema),
    pagination: PaginationSchema,
  })
  .openapi("AuthorsListResponse");

export const SingleAuthorResponseSchema = z
  .object({
    author: AuthorSchema,
  })
  .openapi("SingleAuthorResponse");
