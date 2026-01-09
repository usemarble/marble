import { z } from "@hono/zod-openapi";
import { PaginationSchema } from "./common";

export const SocialSchema = z
  .object({
    url: z.url().openapi({ example: "https://twitter.com/johndoe" }),
    platform: z.string().openapi({ example: "twitter" }),
  })
  .openapi("Social");

export const AuthorSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp3456lm06xfpzcgl0" }),
    name: z.string().openapi({ example: "John Doe" }),
    image: z
      .string()
      .nullable()
      .openapi({ example: "https://media.marblecms.com/avatar.jpg" }),
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

export const AuthorsListResponseSchema = z
  .object({
    authors: z.array(AuthorSchema),
    pagination: PaginationSchema,
  })
  .openapi("AuthorsListResponse");

export const AuthorResponseSchema = z
  .object({
    author: AuthorSchema,
  })
  .openapi("AuthorResponse");
