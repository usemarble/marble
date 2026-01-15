import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@marble/db/workers";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { requireWorkspaceId } from "../lib/workspace";
import {
  ContentFormatSchema,
  ErrorSchema,
  NotFoundSchema,
  PageNotFoundSchema,
  ServerErrorSchema,
} from "../schemas/common";
import { PostResponseSchema, PostsListResponseSchema } from "../schemas/posts";
import type { Env } from "../types/env";

const posts = new OpenAPIHono<{ Bindings: Env }>();

const PostsQuerySchema = z.object({
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

const PostParamsSchema = z.object({
  identifier: z.string().openapi({
    param: { name: "identifier", in: "path" },
    example: "my-post-slug",
    description: "Post ID or slug",
  }),
});

const SinglePostQuerySchema = z.object({
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

const listPostsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Posts"],
  summary: "List posts",
  description:
    "Get a paginated list of published posts with optional filtering",
  request: {
    query: PostsQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: PostsListResponseSchema } },
      description: "Paginated list of posts",
    },
    400: {
      content: {
        "application/json": {
          schema: z.union([ErrorSchema, PageNotFoundSchema]),
        },
      },
      description: "Invalid query parameters or page number",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const getPostRoute = createRoute({
  method: "get",
  path: "/{identifier}",
  tags: ["Posts"],
  summary: "Get post",
  description: "Get a single published post by ID or slug",
  request: {
    params: PostParamsSchema,
    query: SinglePostQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: PostResponseSchema } },
      description: "The requested post",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Post not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

posts.openapi(listPostsRoute, async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const db = createClient(url);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    const {
      limit: rawLimit,
      page,
      order,
      categories,
      excludeCategories,
      tags,
      excludeTags,
      query,
      format,
      featured,
      status,
    } = c.req.valid("query");

    const categoryFilter: Record<string, unknown> = {};
    if (categories.length > 0) {
      categoryFilter.in = categories;
    }
    if (excludeCategories.length > 0) {
      categoryFilter.notIn = excludeCategories;
    }

    const tagFilter: Record<string, unknown> = {};
    if (tags.length > 0) {
      tagFilter.some = { slug: { in: tags } };
    }
    if (excludeTags.length > 0) {
      tagFilter.none = { slug: { in: excludeTags } };
    }

    // Build status filter based on status parameter
    const statusFilter =
      status === "all"
        ? {
            status: { in: ["published", "draft"] as ("published" | "draft")[] },
          }
        : { status: status as "published" | "draft" };

    // Build the where clause
    const where = {
      workspaceId,
      ...statusFilter,
      ...(Object.keys(categoryFilter).length > 0
        ? { category: { slug: categoryFilter } }
        : {}),
      ...(Object.keys(tagFilter).length > 0 ? { tags: tagFilter } : {}),
      ...(query && {
        OR: [{ title: { contains: query } }, { content: { contains: query } }],
      }),
      ...(featured !== undefined && { featured: featured === "true" }),
    };

    // Generate cache key for count (exclude page and format - they don't affect count)
    const countCacheKey = cacheKey(
      workspaceId,
      "posts",
      "list",
      hashQueryParams({
        limit: rawLimit,
        order,
        categories,
        excludeCategories,
        tags,
        excludeTags,
        query,
        featured,
        status,
      }),
      "count"
    );

    // Cache count query separately (1 hour TTL, same as data)
    const totalPosts = await cache.getOrSetCount(countCacheKey, () =>
      db.post.count({ where })
    );

    // Generate cache key for data (includes page and format)
    const listCacheKey = cacheKey(
      workspaceId,
      "posts",
      "list",
      hashQueryParams({
        page,
        limit: rawLimit,
        order,
        categories,
        excludeCategories,
        tags,
        excludeTags,
        query,
        format,
        featured,
        status,
      })
    );

    // Handle pagination
    const limit = rawLimit;
    const totalPages = Math.ceil(totalPosts / limit);

    // Validate page number
    if (page > totalPages && totalPosts > 0) {
      return c.json(
        {
          error: "Invalid page number" as const,
          details: {
            message: `Page ${page} does not exist.`,
            totalPages,
            requestedPage: page,
          },
        },
        400 as const
      );
    }

    // Infer some additional stuff
    const postsToSkip = (page - 1) * limit;
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    const postsData = await cache.getOrSet(listCacheKey, () =>
      db.post.findMany({
        where,
        orderBy: {
          publishedAt: order,
        },
        take: limit,
        skip: postsToSkip,
        select: {
          id: true,
          slug: true,
          title: true,
          content: true,
          featured: true,
          coverImage: true,
          description: true,
          publishedAt: true,
          updatedAt: true,
          attribution: true,
          authors: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
              role: true,
              slug: true,
              socials: {
                select: {
                  url: true,
                  platform: true,
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        },
      })
    );

    // Format posts based on requested format
    const formattedPosts =
      format === "markdown"
        ? postsData.map((post) => ({
            ...post,
            content: NodeHtmlMarkdown.translate(post.content || ""),
            attribution: post.attribution as {
              author: string;
              url: string;
            } | null,
          }))
        : postsData.map((post) => ({
            ...post,
            attribution: post.attribution as {
              author: string;
              url: string;
            } | null,
          }));

    const paginationInfo = {
      limit,
      currentPage: page,
      nextPage,
      previousPage: prevPage,
      totalPages,
      totalItems: totalPosts,
    };

    return c.json(
      {
        posts: formattedPosts,
        pagination: paginationInfo,
      },
      200 as const
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json(
      {
        error: "Failed to fetch posts",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500 as const
    );
  }
});

posts.openapi(getPostRoute, async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const { identifier } = c.req.valid("param");
    const { format, status } = c.req.valid("query");
    const db = createClient(url);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    // Build status filter based on status parameter
    const statusFilter =
      status === "all"
        ? {
            status: { in: ["published", "draft"] as ("published" | "draft")[] },
          }
        : { status: status as "published" | "draft" };

    // Cache by identifier (slug or id), format, and status
    const singleCacheKey = cacheKey(
      workspaceId,
      "posts",
      identifier,
      hashQueryParams({ format, status })
    );

    const post = await cache.getOrSet(singleCacheKey, () =>
      db.post.findFirst({
        where: {
          workspaceId,
          OR: [{ slug: identifier }, { id: identifier }],
          ...statusFilter,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          content: true,
          featured: true,
          coverImage: true,
          description: true,
          publishedAt: true,
          updatedAt: true,
          attribution: true,
          authors: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
              role: true,
              slug: true,
              socials: {
                select: {
                  url: true,
                  platform: true,
                },
              },
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        },
      })
    );

    if (!post) {
      return c.json(
        {
          error: "Post not found",
          message: "The requested post does not exist or is not published",
        },
        404 as const
      );
    }

    // Format post based on requested format
    const formattedPost =
      format === "markdown"
        ? {
            ...post,
            content: NodeHtmlMarkdown.translate(post.content || ""),
            attribution: post.attribution as {
              author: string;
              url: string;
            } | null,
          }
        : {
            ...post,
            attribution: post.attribution as {
              author: string;
              url: string;
            } | null,
          };

    return c.json({ post: formattedPost }, 200 as const);
  } catch (_error) {
    return c.json({ error: "Failed to fetch post" }, 500 as const);
  }
});

export default posts;
