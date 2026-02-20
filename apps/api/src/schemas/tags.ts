import { z } from "@hono/zod-openapi";
import { PaginationSchema } from "./common";

export const TagSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp4567no07ygqadhm1" }),
    name: z.string().openapi({ example: "JavaScript" }),
    slug: z.string().openapi({ example: "javascript" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "JavaScript tutorials" }),
    count: z
      .object({
        posts: z.number().int().openapi({ example: 8 }),
      })
      .openapi({ description: "Number of published posts with this tag" }),
  })
  .openapi("Tag");

export const TagsListResponseSchema = z
  .object({
    tags: z.array(TagSchema),
    pagination: PaginationSchema,
  })
  .openapi("TagsListResponse");

export const TagResponseSchema = z
  .object({
    tag: TagSchema,
  })
  .openapi("TagResponse");

export const CreateTagBodySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .openapi({ example: "JavaScript" }),
    slug: z
      .string()
      .min(1, "Slug cannot be empty")
      .openapi({ example: "javascript" }),
    description: z
      .string()
      .optional()
      .openapi({ example: "JavaScript tutorials and guides" }),
  })
  .openapi("CreateTagBody");

export const CreateTagResponseSchema = z
  .object({
    tag: z.object({
      id: z.string().openapi({ example: "cryitfjp4567no07ygqadhm1" }),
      name: z.string().openapi({ example: "JavaScript" }),
      slug: z.string().openapi({ example: "javascript" }),
      description: z
        .string()
        .nullable()
        .openapi({ example: "JavaScript tutorials and guides" }),
    }),
  })
  .openapi("CreateTagResponse");

export const UpdateTagBodySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .optional()
      .openapi({ example: "TypeScript" }),
    slug: z
      .string()
      .min(1, "Slug cannot be empty")
      .optional()
      .openapi({ example: "typescript" }),
    description: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "TypeScript tutorials and guides" }),
  })
  .openapi("UpdateTagBody");
