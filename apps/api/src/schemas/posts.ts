import { z } from "@hono/zod-openapi";
import { ContentFormatSchema, PaginationSchema } from "./common";

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
    status: z.enum(["published", "draft"]).openapi({ example: "published" }),
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
    authors: z.array(AuthorRefSchema),
    category: CategoryRefSchema,
    tags: z.array(TagRefSchema),
    fields: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.array(z.string()),
          z.null(),
        ])
      )
      .openapi({
        description: "Custom field values keyed by field key",
        example: {
          release_date: "2024-01-15",
          priority_score: 5,
          hashtags: ["#javascript", "#nextjs"],
        },
      }),
    content: z.string().openapi({ example: "<p>Hello world</p>" }),
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

export const PostsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .openapi({
      param: { name: "limit", in: "query" },
      type: "integer",
      example: 10,
      description: "Number of posts per page (1-100)",
    }),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .openapi({
      param: { name: "page", in: "query" },
      type: "integer",
      example: 1,
      description: "Page number",
    }),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc")
    .openapi({
      param: { name: "order", in: "query" },
      example: "desc",
      description: "Sort order by publishedAt",
    }),
  categories: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : val,
      z.array(z.string()).optional().default([])
    )
    .openapi({
      param: { name: "categories", in: "query", style: "form", explode: false },
      type: "array",
      items: { type: "string" },
      example: ["tech", "news"],
      description: "Category slugs to include",
    }),
  excludeCategories: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : val,
      z.array(z.string()).optional().default([])
    )
    .openapi({
      param: {
        name: "excludeCategories",
        in: "query",
        style: "form",
        explode: false,
      },
      type: "array",
      items: { type: "string" },
      example: ["changelog"],
      description: "Category slugs to exclude",
    }),
  tags: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : val,
      z.array(z.string()).optional().default([])
    )
    .openapi({
      param: { name: "tags", in: "query", style: "form", explode: false },
      type: "array",
      items: { type: "string" },
      example: ["javascript", "react"],
      description: "Tag slugs to include",
    }),
  excludeTags: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : val,
      z.array(z.string()).optional().default([])
    )
    .openapi({
      param: {
        name: "excludeTags",
        in: "query",
        style: "form",
        explode: false,
      },
      type: "array",
      items: { type: "string" },
      example: ["outdated"],
      description: "Tag slugs to exclude",
    }),
  query: z
    .string()
    .optional()
    .openapi({
      param: { name: "query", in: "query" },
      example: "nextjs",
      description: "Search query for title and content",
    }),
  format: ContentFormatSchema.optional().openapi({
    param: { name: "format", in: "query" },
    example: "html",
    description: "Content format (html or markdown)",
  }),
  featured: z
    .enum(["true", "false"])
    .optional()
    .openapi({
      param: { name: "featured", in: "query" },
      example: "true",
      description: "Filter by featured status",
    }),
  status: z
    .enum(["published", "draft", "all"])
    .optional()
    .default("published")
    .openapi({
      param: { name: "status", in: "query" },
      example: "published",
      description:
        "Filter by post status. Use 'published' for live posts, 'draft' for unpublished posts, or 'all' for both.",
    }),
});

export const PostParamsSchema = z.object({
  identifier: z.string().openapi({
    param: { name: "identifier", in: "path" },
    example: "my-post-slug",
    description: "Post ID or slug",
  }),
});

export const SinglePostQuerySchema = z.object({
  format: ContentFormatSchema.optional().openapi({
    param: { name: "format", in: "query" },
    example: "html",
    description: "Content format (html or markdown)",
  }),
  status: z
    .enum(["published", "draft", "all"])
    .optional()
    .default("published")
    .openapi({
      param: { name: "status", in: "query" },
      example: "published",
      description:
        "Filter by post status. Use 'published' for live posts, 'draft' for unpublished posts, or 'all' for both.",
    }),
});

export const CreatePostBodySchema = z
  .object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .openapi({ example: "Getting Started with Next.js" }),
    content: z
      .string()
      .min(1, "Content cannot be empty")
      .openapi({ example: "<p>Hello world</p>" }),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .openapi({ example: "A beginner's guide to Next.js" }),
    slug: z
      .string()
      .slugify()
      .min(1, "Slug cannot be empty")
      .openapi({ example: "getting-started-with-nextjs" }),
    categoryId: z
      .string()
      .min(1, "Category ID is required")
      .openapi({ example: "cryitfjp2345kl05weoybfk9" }),
    status: z.enum(["published", "draft"]).openapi({ example: "draft" }),
    tags: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["cryitfjp4567no07ygqadhm1"],
        description: "Array of tag IDs to attach to the post",
      }),
    authors: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["cryitfjp3456lm06xfpzcgl0"],
        description:
          "Array of author IDs. If omitted, the first workspace author is used.",
      }),
    featured: z.boolean().optional().default(false).openapi({ example: false }),
    coverImage: z
      .url()
      .nullable()
      .optional()
      .openapi({ example: "https://media.marblecms.com/cover.jpg" }),
    publishedAt: z.iso.datetime().optional().openapi({
      example: "2024-01-15T10:00:00Z",
      description: "ISO 8601 datetime. Defaults to current time if omitted.",
    }),
  })
  .openapi("CreatePostBody");

export const CreatePostResponseSchema = z
  .object({
    post: z.object({
      id: z.string().openapi({ example: "cryitfjp5678mn09qrstuvwx" }),
      slug: z.string().openapi({ example: "getting-started-with-nextjs" }),
      title: z.string().openapi({ example: "Getting Started with Next.js" }),
      status: z.string().openapi({ example: "draft" }),
      featured: z.boolean().openapi({ example: false }),
      publishedAt: z.string().openapi({ example: "2024-01-15T10:00:00.000Z" }),
      createdAt: z.string().openapi({ example: "2024-01-15T10:00:00.000Z" }),
    }),
  })
  .openapi("CreatePostResponse");

export const UpdatePostBodySchema = z
  .object({
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .optional()
      .openapi({ example: "Updated Post Title" }),
    content: z
      .string()
      .min(1, "Content cannot be empty")
      .optional()
      .openapi({ example: "<p>Updated content</p>" }),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .optional()
      .openapi({ example: "Updated description" }),
    slug: z
      .string()
      .slugify()
      .min(1, "Slug cannot be empty")
      .optional()
      .openapi({ example: "updated-post-slug" }),
    categoryId: z
      .string()
      .min(1, "Category ID is required")
      .optional()
      .openapi({ example: "cryitfjp2345kl05weoybfk9" }),
    status: z
      .enum(["published", "draft"])
      .optional()
      .openapi({ example: "published" }),
    tags: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["cryitfjp4567no07ygqadhm1"],
        description:
          "Array of tag IDs. Replaces all existing tags when provided.",
      }),
    authors: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["cryitfjp3456lm06xfpzcgl0"],
        description:
          "Array of author IDs. Replaces all existing authors when provided.",
      }),
    featured: z.boolean().optional().openapi({ example: true }),
    coverImage: z
      .url()
      .nullable()
      .optional()
      .openapi({ example: "https://media.marblecms.com/new-cover.jpg" }),
    publishedAt: z.iso
      .datetime()
      .optional()
      .openapi({ example: "2024-02-01T10:00:00Z" }),
  })
  .openapi("UpdatePostBody");

export const UpdatePostResponseSchema = z
  .object({
    post: z.object({
      id: z.string().openapi({ example: "cryitfjp5678mn09qrstuvwx" }),
      slug: z.string().openapi({ example: "updated-post-slug" }),
      title: z.string().openapi({ example: "Updated Post Title" }),
      status: z.string().openapi({ example: "published" }),
      featured: z.boolean().openapi({ example: true }),
      publishedAt: z.string().openapi({ example: "2024-02-01T10:00:00.000Z" }),
      updatedAt: z.string().openapi({ example: "2024-02-01T12:00:00.000Z" }),
    }),
  })
  .openapi("UpdatePostResponse");
