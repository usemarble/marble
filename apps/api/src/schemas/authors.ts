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

export const SocialInputSchema = z
  .object({
    platform: z
      .enum([
        "x",
        "twitter",
        "github",
        "facebook",
        "instagram",
        "youtube",
        "tiktok",
        "linkedin",
        "website",
        "onlyfans",
        "discord",
        "bluesky",
      ])
      .openapi({ example: "x" }),
    url: z
      .url("Must be a valid URL")
      .openapi({ example: "https://x.com/johndoe" }),
  })
  .openapi("SocialInput");

export const CreateAuthorBodySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .openapi({ example: "John Doe" }),
    slug: z
      .string()
      .min(1, "Slug is required")
      .openapi({ example: "john-doe" }),
    bio: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Technical writer and developer" }),
    role: z.string().nullable().optional().openapi({ example: "Editor" }),
    email: z
      .email()
      .nullable()
      .optional()
      .openapi({ example: "john@example.com" }),
    image: z
      .url()
      .nullable()
      .optional()
      .openapi({ example: "https://media.marblecms.com/avatar.jpg" }),
    socials: z
      .array(SocialInputSchema)
      .optional()
      .openapi({ description: "Social media links for this author" }),
  })
  .openapi("CreateAuthorBody");

export const CreateAuthorResponseSchema = z
  .object({
    author: z.object({
      id: z.string().openapi({ example: "cryitfjp3456lm06xfpzcgl0" }),
      name: z.string().openapi({ example: "John Doe" }),
      slug: z.string().openapi({ example: "john-doe" }),
      bio: z
        .string()
        .nullable()
        .openapi({ example: "Technical writer and developer" }),
      role: z.string().nullable().openapi({ example: "Editor" }),
      image: z
        .string()
        .nullable()
        .openapi({ example: "https://media.marblecms.com/avatar.jpg" }),
      socials: z.array(SocialSchema),
    }),
  })
  .openapi("CreateAuthorResponse");

export const UpdateAuthorBodySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .optional()
      .openapi({ example: "John Doe" }),
    slug: z
      .string()
      .min(1, "Slug cannot be empty")
      .optional()
      .openapi({ example: "john-doe" }),
    bio: z.string().nullable().optional().openapi({ example: "Updated bio" }),
    role: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Senior Editor" }),
    email: z
      .email()
      .nullable()
      .optional()
      .openapi({ example: "john@example.com" }),
    image: z
      .string()
      .url()
      .nullable()
      .optional()
      .openapi({ example: "https://media.marblecms.com/new-avatar.jpg" }),
    socials: z.array(SocialInputSchema).optional().openapi({
      description:
        "Social media links. Replaces all existing socials when provided.",
    }),
  })
  .openapi("UpdateAuthorBody");
