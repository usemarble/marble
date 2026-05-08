import { z } from "@hono/zod-openapi";
import { LimitQuerySchema, PageQuerySchema, PaginationSchema } from "./common";

export const MediaTypeSchema = z
  .enum(["image", "video", "audio", "document"])
  .openapi("MediaType");

export const MediaSchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp1234jl04vdnycek8" }),
    name: z.string().openapi({ example: "Hero image" }),
    url: z
      .url()
      .openapi({ example: "https://cdn.marblecms.com/media/hero.jpg" }),
    alt: z.string().nullable().openapi({ example: "A dashboard screenshot" }),
    size: z.number().int().openapi({
      example: 382_019,
      description: "File size in bytes",
    }),
    mimeType: z.string().nullable().openapi({ example: "image/jpeg" }),
    width: z.number().int().nullable().openapi({ example: 1600 }),
    height: z.number().int().nullable().openapi({ example: 900 }),
    duration: z
      .number()
      .int()
      .nullable()
      .openapi({ example: 12_000, description: "Duration in milliseconds" }),
    blurHash: z
      .string()
      .nullable()
      .openapi({ example: "LEHV6nWB2yk8pyo0adR*.7kCMdnj" }),
    type: MediaTypeSchema,
    createdAt: z.iso.datetime().openapi({ example: "2024-01-15T10:00:00Z" }),
    updatedAt: z.iso.datetime().openapi({ example: "2024-01-16T12:00:00Z" }),
  })
  .openapi("Media");

export const MediaListResponseSchema = z
  .object({
    media: z.array(MediaSchema),
    pagination: PaginationSchema,
  })
  .openapi("MediaListResponse");

export const MediaResponseSchema = z
  .object({
    media: MediaSchema,
  })
  .openapi("MediaResponse");

export const MediaQuerySchema = z.object({
  limit: LimitQuerySchema,
  page: PageQuerySchema,
  query: z
    .string()
    .optional()
    .openapi({
      param: { name: "query", in: "query" },
      example: "hero",
      description: "Search media by name, alt text, URL, or MIME type",
    }),
  type: MediaTypeSchema.optional().openapi({
    param: { name: "type", in: "query" },
    example: "image",
    description: "Filter by inferred media type",
  }),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc")
    .openapi({
      param: { name: "order", in: "query" },
      example: "desc",
      description: "Sort order by creation date",
    }),
});

export const MediaParamsSchema = z.object({
  id: z.string().openapi({
    param: { name: "id", in: "path" },
    example: "cryitfjp1234jl04vdnycek8",
    description: "Media asset ID",
  }),
});

export const UpdateMediaBodySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .optional()
      .openapi({ example: "Updated hero image" }),
    alt: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Dashboard with a post editor open" }),
  })
  .openapi("UpdateMediaBody");

export const UploadMediaBodySchema = z
  .object({
    file: z.any().openapi({
      type: "string",
      format: "binary",
      description: "Media file to upload. Maximum size: 5 MiB.",
    }),
    name: z.string().optional().openapi({ example: "Hero image" }),
    alt: z.string().optional().openapi({ example: "Dashboard screenshot" }),
  })
  .openapi("UploadMediaBody");
