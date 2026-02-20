import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@marble/db/workers";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { sanitizeHtml } from "../lib/sanitize";
import { requireWorkspaceId } from "../lib/workspace";
import {
  ConflictSchema,
  ContentFormatSchema,
  DeleteResponseSchema,
  ErrorSchema,
  ForbiddenSchema,
  NotFoundSchema,
  PageNotFoundSchema,
  ServerErrorSchema,
} from "../schemas/common";
import {
  CreatePostBodySchema,
  CreatePostResponseSchema,
  PostResponseSchema,
  PostsListResponseSchema,
  UpdatePostBodySchema,
  UpdatePostResponseSchema,
} from "../schemas/posts";
import type { Env } from "../types/env";

const posts = new OpenAPIHono<{ Bindings: Env }>();

/**
 * Build Prisma status filter based on status parameter
 */
const buildStatusFilter = (status: "published" | "draft" | "all") =>
  status === "all"
    ? { status: { in: ["published", "draft"] as ("published" | "draft")[] } }
    : { status };

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
  description:
    "Get a single post by ID or slug, with optional status filtering",
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

const createPostRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Posts"],
  summary: "Create post",
  description:
    "Create a new post. Requires a private API key. Category is required. If authors are not provided, the first workspace author is used.",
  request: {
    body: {
      content: { "application/json": { schema: CreatePostBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: CreatePostResponseSchema } },
      description: "Post created successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body or referenced resources not found",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Post with this slug already exists",
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

    const statusFilter = buildStatusFilter(status);

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

    const statusFilter = buildStatusFilter(status);

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
          message:
            "The requested post does not exist or does not match the requested status",
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

posts.openapi(createPostRoute, async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const db = createClient(url);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    // 1. Check slug uniqueness within workspace
    const existingPost = await db.post.findFirst({
      where: {
        slug: body.slug,
        workspaceId,
      },
    });

    if (existingPost) {
      return c.json(
        {
          error: "Slug already in use",
          message: "A post with this slug already exists in this workspace",
        },
        409 as const
      );
    }

    // 2. Validate category exists in workspace
    const category = await db.category.findFirst({
      where: {
        id: body.categoryId,
        workspaceId,
      },
    });

    if (!category) {
      return c.json(
        {
          error: "Invalid category",
          message:
            "The specified category does not exist in this workspace. Use GET /v1/categories to list available categories.",
        },
        400 as const
      );
    }

    // 3. Validate tags if provided
    let validTagIds: string[] = [];
    if (body.tags && body.tags.length > 0) {
      const validTags = await db.tag.findMany({
        where: {
          id: { in: body.tags },
          workspaceId,
        },
        select: { id: true },
      });

      validTagIds = validTags.map((t) => t.id);

      // Check if any provided tag IDs were invalid
      const invalidTagIds = body.tags.filter((id) => !validTagIds.includes(id));
      if (invalidTagIds.length > 0) {
        return c.json(
          {
            error: "Invalid tags",
            message: `The following tag IDs do not exist in this workspace: ${invalidTagIds.join(", ")}. Use GET /v1/tags to list available tags.`,
          },
          400 as const
        );
      }
    }

    // 4. Resolve authors
    let authorIds: string[];

    if (body.authors && body.authors.length > 0) {
      // Validate provided author IDs
      const validAuthors = await db.author.findMany({
        where: {
          id: { in: body.authors },
          workspaceId,
          isActive: true,
        },
        select: { id: true },
      });

      if (validAuthors.length === 0) {
        return c.json(
          {
            error: "Invalid authors",
            message:
              "None of the provided author IDs exist in this workspace. Use GET /v1/authors to list available authors.",
          },
          400 as const
        );
      }

      const invalidAuthorIds = body.authors.filter(
        (id) => !validAuthors.map((a) => a.id).includes(id)
      );
      if (invalidAuthorIds.length > 0) {
        return c.json(
          {
            error: "Invalid authors",
            message: `The following author IDs do not exist in this workspace: ${invalidAuthorIds.join(", ")}. Use GET /v1/authors to list available authors.`,
          },
          400 as const
        );
      }

      authorIds = validAuthors.map((a) => a.id);
    } else {
      // Fallback: use the first workspace author
      const firstAuthor = await db.author.findFirst({
        where: {
          workspaceId,
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!firstAuthor) {
        return c.json(
          {
            error: "No authors available",
            message:
              "This workspace has no authors. Please create an author in the dashboard before creating posts via the API.",
          },
          400 as const
        );
      }

      authorIds = [firstAuthor.id];
    }

    // The first author in the list becomes the primary author
    const primaryAuthorId = authorIds[0];

    // 5. Determine publishedAt
    const publishedAt = body.publishedAt
      ? new Date(body.publishedAt)
      : new Date();

    // 6. Create the post
    const postCreated = await db.post.create({
      data: {
        title: body.title,
        content: sanitizeHtml(body.content),
        contentJson: {}, // API users send HTML, not TipTap JSON
        description: body.description,
        slug: body.slug,
        categoryId: body.categoryId,
        status: body.status,
        featured: body.featured ?? false,
        coverImage: body.coverImage ?? null,
        publishedAt,
        attribution: body.attribution ?? undefined,
        workspaceId,
        primaryAuthorId,
        tags:
          validTagIds.length > 0
            ? { connect: validTagIds.map((id) => ({ id })) }
            : undefined,
        authors: {
          connect: authorIds.map((id) => ({ id })),
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        featured: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    // 7. Invalidate cache
    await cache.invalidateResource(workspaceId, "posts");
    await cache.invalidateResource(workspaceId, "tags");
    await cache.invalidateResource(workspaceId, "categories");
    await cache.invalidateResource(workspaceId, "authors");

    return c.json({ post: postCreated }, 201 as const);
  } catch (error) {
    console.error("Error creating post:", error);
    return c.json(
      {
        error: "Failed to create post",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500 as const
    );
  }
});

const updatePostRoute = createRoute({
  method: "patch",
  path: "/{identifier}",
  tags: ["Posts"],
  summary: "Update post",
  description:
    "Update an existing post by ID or slug. All fields are optional — only provided fields are updated. Requires a private API key.",
  request: {
    params: PostParamsSchema,
    body: {
      content: { "application/json": { schema: UpdatePostBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: UpdatePostResponseSchema } },
      description: "Post updated successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body or referenced resources not found",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Post not found",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Post with this slug already exists",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const deletePostRoute = createRoute({
  method: "delete",
  path: "/{identifier}",
  tags: ["Posts"],
  summary: "Delete post",
  description: "Delete a post by ID or slug. Requires a private API key.",
  request: {
    params: PostParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeleteResponseSchema } },
      description: "Post deleted successfully",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
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

posts.openapi(updatePostRoute, async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const db = createClient(url);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    // 1. Find the existing post
    const existingPost = await db.post.findFirst({
      where: {
        workspaceId,
        OR: [{ slug: identifier }, { id: identifier }],
      },
    });

    if (!existingPost) {
      return c.json(
        {
          error: "Post not found",
          message: "The requested post does not exist",
        },
        404 as const
      );
    }

    // 2. If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existingPost.slug) {
      const slugConflict = await db.post.findFirst({
        where: {
          slug: body.slug,
          workspaceId,
          id: { not: existingPost.id },
        },
      });

      if (slugConflict) {
        return c.json(
          {
            error: "Slug already in use",
            message: "A post with this slug already exists in this workspace",
          },
          409 as const
        );
      }
    }

    // 3. Validate category if provided
    if (body.categoryId) {
      const category = await db.category.findFirst({
        where: { id: body.categoryId, workspaceId },
      });

      if (!category) {
        return c.json(
          {
            error: "Invalid category",
            message:
              "The specified category does not exist in this workspace. Use GET /v1/categories to list available categories.",
          },
          400 as const
        );
      }
    }

    // 4. Validate tags if provided
    let tagUpdate: { set: { id: string }[] } | undefined;
    if (body.tags !== undefined) {
      if (body.tags.length > 0) {
        const validTags = await db.tag.findMany({
          where: { id: { in: body.tags }, workspaceId },
          select: { id: true },
        });

        const validTagIds = validTags.map((t) => t.id);
        const invalidTagIds = body.tags.filter(
          (id) => !validTagIds.includes(id)
        );

        if (invalidTagIds.length > 0) {
          return c.json(
            {
              error: "Invalid tags",
              message: `The following tag IDs do not exist in this workspace: ${invalidTagIds.join(", ")}. Use GET /v1/tags to list available tags.`,
            },
            400 as const
          );
        }

        tagUpdate = { set: validTagIds.map((id) => ({ id })) };
      } else {
        // Empty array = remove all tags
        tagUpdate = { set: [] };
      }
    }

    // 5. Validate authors if provided
    let authorUpdate: { set: { id: string }[] } | undefined;
    let primaryAuthorId: string | undefined;
    if (body.authors !== undefined) {
      if (body.authors.length === 0) {
        return c.json(
          {
            error: "Invalid authors",
            message:
              "Authors array cannot be empty. At least one author is required.",
          },
          400 as const
        );
      }

      const validAuthors = await db.author.findMany({
        where: { id: { in: body.authors }, workspaceId, isActive: true },
        select: { id: true },
      });

      const invalidAuthorIds = body.authors.filter(
        (id) => !validAuthors.map((a) => a.id).includes(id)
      );

      if (invalidAuthorIds.length > 0) {
        return c.json(
          {
            error: "Invalid authors",
            message: `The following author IDs do not exist in this workspace: ${invalidAuthorIds.join(", ")}. Use GET /v1/authors to list available authors.`,
          },
          400 as const
        );
      }

      authorUpdate = { set: validAuthors.map((a) => ({ id: a.id })) };
      primaryAuthorId = validAuthors[0].id;
    }

    // 6. Build update data
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    if (body.content !== undefined) {
      updateData.content = sanitizeHtml(body.content);
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.slug !== undefined) {
      updateData.slug = body.slug;
    }
    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.featured !== undefined) {
      updateData.featured = body.featured;
    }
    if (body.coverImage !== undefined) {
      updateData.coverImage = body.coverImage;
    }
    if (body.publishedAt !== undefined) {
      updateData.publishedAt = new Date(body.publishedAt);
    }
    if (body.attribution !== undefined) {
      updateData.attribution = body.attribution ?? undefined;
    }
    if (tagUpdate) {
      updateData.tags = tagUpdate;
    }
    if (authorUpdate) {
      updateData.authors = authorUpdate;
    }
    if (primaryAuthorId) {
      updateData.primaryAuthorId = primaryAuthorId;
    }

    const postUpdated = await db.post.update({
      where: { id: existingPost.id },
      data: updateData,
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        featured: true,
        publishedAt: true,
        updatedAt: true,
      },
    });

    // 7. Invalidate cache
    await cache.invalidateResource(workspaceId, "posts");
    await cache.invalidateResource(workspaceId, "tags");
    await cache.invalidateResource(workspaceId, "categories");
    await cache.invalidateResource(workspaceId, "authors");

    return c.json({ post: postUpdated }, 200 as const);
  } catch (error) {
    console.error("Error updating post:", error);
    return c.json(
      {
        error: "Failed to update post",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500 as const
    );
  }
});

posts.openapi(deletePostRoute, async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const db = createClient(url);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingPost = await db.post.findFirst({
      where: {
        workspaceId,
        OR: [{ slug: identifier }, { id: identifier }],
      },
    });

    if (!existingPost) {
      return c.json(
        {
          error: "Post not found",
          message: "The requested post does not exist",
        },
        404 as const
      );
    }

    await db.post.delete({
      where: { id: existingPost.id },
    });

    await cache.invalidateResource(workspaceId, "posts");
    await cache.invalidateResource(workspaceId, "tags");
    await cache.invalidateResource(workspaceId, "categories");
    await cache.invalidateResource(workspaceId, "authors");

    return c.json({ id: existingPost.id }, 200 as const);
  } catch (error) {
    console.error("Error deleting post:", error);
    return c.json(
      {
        error: "Failed to delete post",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500 as const
    );
  }
});

export default posts;
