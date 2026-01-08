import { z } from "@hono/zod-openapi";
import { PaginationSchema } from "./common";

export const TagSchema = z
  .object({
    id: z.string().openapi({ example: "clx789ghi" }),
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

export const SingleTagResponseSchema = z
  .object({
    tag: TagSchema,
  })
  .openapi("SingleTagResponse");
