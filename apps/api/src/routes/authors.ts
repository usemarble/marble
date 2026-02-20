import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@marble/db/workers";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { requireWorkspaceId } from "../lib/workspace";
import {
  AuthorResponseSchema,
  AuthorsListResponseSchema,
  CreateAuthorBodySchema,
  CreateAuthorResponseSchema,
  UpdateAuthorBodySchema,
} from "../schemas/authors";
import {
  ConflictSchema,
  DeleteResponseSchema,
  ErrorSchema,
  ForbiddenSchema,
  LimitQuerySchema,
  NotFoundSchema,
  PageNotFoundSchema,
  PageQuerySchema,
  ServerErrorSchema,
} from "../schemas/common";
import type { Env } from "../types/env";

const authors = new OpenAPIHono<{ Bindings: Env }>();

const AuthorsQuerySchema = z.object({
  limit: LimitQuerySchema,
  page: PageQuerySchema,
});

const AuthorParamsSchema = z.object({
  identifier: z.string().openapi({
    param: { name: "identifier", in: "path" },
    example: "john-doe",
    description: "Author ID or slug",
  }),
});

const listAuthorsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Authors"],
  summary: "List authors",
  description: "Get a paginated list of authors who have published posts",
  request: {
    query: AuthorsQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: AuthorsListResponseSchema } },
      description: "Paginated list of authors",
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

const getAuthorRoute = createRoute({
  method: "get",
  path: "/{identifier}",
  tags: ["Authors"],
  summary: "Get author",
  description: "Get a single author by ID or slug",
  request: {
    params: AuthorParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: AuthorResponseSchema } },
      description: "The requested author",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Author not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

authors.openapi(listAuthorsRoute, async (c) => {
  const url = c.env.DATABASE_URL;
  const workspaceId = requireWorkspaceId(c);
  const db = createClient(url);
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  const { limit, page } = c.req.valid("query");

  // Generate cache key for count (exclude page - it doesn't affect count)
  const countCacheKey = cacheKey(
    workspaceId,
    "authors",
    "list",
    hashQueryParams({ limit }),
    "count"
  );

  // Cache count query separately (1 hour TTL, invalidated with posts)
  const totalAuthors = await cache.getOrSetCount(countCacheKey, () =>
    db.author.count({
      where: {
        workspaceId,
        coAuthoredPosts: {
          some: {
            status: "published",
          },
        },
      },
    })
  );

  // Generate cache key for data (includes page)
  const listCacheKey = cacheKey(
    workspaceId,
    "authors",
    "list",
    hashQueryParams({ page, limit })
  );

  const totalPages = Math.ceil(totalAuthors / limit);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const authorsToSkip = limit ? (page - 1) * limit : 0;

  if (page > totalPages && totalAuthors > 0) {
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

  try {
    const authorsList = await cache.getOrSet(listCacheKey, () =>
      db.author.findMany({
        where: {
          workspaceId,
          coAuthoredPosts: {
            some: {
              status: "published",
            },
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
          slug: true,
          bio: true,
          role: true,
          socials: {
            select: {
              url: true,
              platform: true,
            },
          },
          _count: {
            select: {
              coAuthoredPosts: {
                where: {
                  status: "published",
                },
              },
            },
          },
        },
        orderBy: [{ name: "asc" }],
        take: limit,
        skip: authorsToSkip,
      })
    );

    // because I dont want prisma's ugly _count
    const transformedAuthors = authorsList.map((author) => {
      const { _count, ...rest } = author;
      return {
        ...rest,
        count: {
          posts: _count.coAuthoredPosts,
        },
      };
    });

    return c.json(
      {
        authors: transformedAuthors,
        pagination: {
          limit,
          currentPage: page,
          nextPage,
          previousPage: prevPage,
          totalPages,
          totalItems: totalAuthors,
        },
      },
      200 as const
    );
  } catch (_error) {
    return c.json({ error: "Failed to fetch authors" }, 500 as const);
  }
});

authors.openapi(getAuthorRoute, async (c) => {
  const url = c.env.DATABASE_URL;
  const workspaceId = requireWorkspaceId(c);
  const { identifier } = c.req.valid("param");
  const db = createClient(url);
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  try {
    // Cache by identifier (slug or id)
    const singleCacheKey = cacheKey(workspaceId, "authors", identifier);

    const author = await cache.getOrSet(singleCacheKey, () =>
      db.author.findFirst({
        where: {
          workspaceId,
          OR: [{ id: identifier }, { slug: identifier }],
        },
        select: {
          id: true,
          name: true,
          image: true,
          slug: true,
          bio: true,
          role: true,
          socials: {
            select: {
              url: true,
              platform: true,
            },
          },
        },
      })
    );

    if (!author) {
      return c.json(
        {
          error: "Author not found",
          message: "The requested author does not exist",
        },
        404 as const
      );
    }

    return c.json({ author }, 200 as const);
  } catch (_error) {
    return c.json({ error: "Failed to fetch author" }, 500 as const);
  }
});

// ─── POST /v1/authors ───

const createAuthorRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Authors"],
  summary: "Create author",
  description:
    "Create a new author. Requires a private API key. Hobby plan is limited to 1 author.",
  request: {
    body: {
      content: { "application/json": { schema: CreateAuthorBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: CreateAuthorResponseSchema } },
      description: "Author created successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description:
        "Public API key used for write operation or plan limit reached",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Author with this slug already exists",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

authors.openapi(createAuthorRoute, async (c) => {
  try {
    const db = createClient(c.env.DATABASE_URL);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    // Check plan limits — hobby plan limited to 1 author
    const workspace = await db.organization.findUnique({
      where: { id: workspaceId },
      select: {
        subscriptions: {
          where: {
            OR: [
              { status: "active" },
              { status: "trialing" },
              {
                status: "canceled",
                cancelAtPeriodEnd: true,
                currentPeriodEnd: { gt: new Date() },
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { plan: true },
        },
      },
    });

    const activeSub = workspace?.subscriptions[0];
    const plan = activeSub?.plan?.toLowerCase() === "pro" ? "pro" : "hobby";

    if (plan === "hobby") {
      const existingCount = await db.author.count({
        where: { workspaceId, isActive: true },
      });

      if (existingCount >= 1) {
        return c.json(
          {
            error: "Author limit reached",
            message:
              "Hobby plan is limited to 1 author. Upgrade to Pro to create more.",
          },
          403 as const
        );
      }
    }

    // Check slug uniqueness
    const existingAuthor = await db.author.findFirst({
      where: { workspaceId, slug: body.slug },
    });

    if (existingAuthor) {
      return c.json(
        {
          error: "Slug already in use",
          message: "An author with this slug already exists in this workspace",
        },
        409 as const
      );
    }

    const author = await db.author.create({
      data: {
        name: body.name,
        slug: body.slug,
        bio: body.bio ?? null,
        role: body.role ?? null,
        email: body.email ?? null,
        image: body.image ?? null,
        workspaceId,
        ...(body.socials &&
          body.socials.length > 0 && {
            socials: {
              create: body.socials.map((s) => ({
                url: s.url,
                platform: s.platform,
              })),
            },
          }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        role: true,
        image: true,
        socials: {
          select: { url: true, platform: true },
        },
      },
    });

    await cache.invalidateResource(workspaceId, "authors");

    return c.json({ author }, 201 as const);
  } catch (error) {
    console.error("Error creating author:", error);
    return c.json(
      {
        error: "Failed to create author",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500 as const
    );
  }
});

// ─── PATCH /v1/authors/{identifier} ───

const updateAuthorRoute = createRoute({
  method: "patch",
  path: "/{identifier}",
  tags: ["Authors"],
  summary: "Update author",
  description:
    "Update an existing author by ID or slug. Requires a private API key.",
  request: {
    params: AuthorParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateAuthorBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: CreateAuthorResponseSchema } },
      description: "Author updated successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Author not found",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Author with this slug already exists",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

authors.openapi(updateAuthorRoute, async (c) => {
  try {
    const db = createClient(c.env.DATABASE_URL);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    const existingAuthor = await db.author.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });

    if (!existingAuthor) {
      return c.json(
        {
          error: "Author not found",
          message: "The requested author does not exist",
        },
        404 as const
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existingAuthor.slug) {
      const slugConflict = await db.author.findFirst({
        where: {
          slug: body.slug,
          workspaceId,
          id: { not: existingAuthor.id },
        },
      });

      if (slugConflict) {
        return c.json(
          {
            error: "Slug already in use",
            message:
              "An author with this slug already exists in this workspace",
          },
          409 as const
        );
      }
    }

    const updatedAuthor = await db.author.update({
      where: { id: existingAuthor.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.role !== undefined && { role: body.role }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.image !== undefined && { image: body.image }),
        // Socials: delete all existing and recreate (same pattern as CMS)
        ...(body.socials !== undefined && {
          socials: {
            deleteMany: {},
            ...(body.socials.length > 0 && {
              create: body.socials.map((s) => ({
                url: s.url,
                platform: s.platform,
              })),
            }),
          },
        }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        role: true,
        image: true,
        socials: {
          select: { url: true, platform: true },
        },
      },
    });

    await cache.invalidateResource(workspaceId, "authors");
    await cache.invalidateResource(workspaceId, "posts");

    return c.json({ author: updatedAuthor }, 200 as const);
  } catch (error) {
    console.error("Error updating author:", error);
    return c.json(
      {
        error: "Failed to update author",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500 as const
    );
  }
});

// ─── DELETE /v1/authors/{identifier} ───

const deleteAuthorRoute = createRoute({
  method: "delete",
  path: "/{identifier}",
  tags: ["Authors"],
  summary: "Delete author",
  description: "Delete an author by ID or slug. Requires a private API key.",
  request: {
    params: AuthorParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeleteResponseSchema } },
      description: "Author deleted successfully",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Author not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

authors.openapi(deleteAuthorRoute, async (c) => {
  try {
    const db = createClient(c.env.DATABASE_URL);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingAuthor = await db.author.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });

    if (!existingAuthor) {
      return c.json(
        {
          error: "Author not found",
          message: "The requested author does not exist",
        },
        404 as const
      );
    }

    await db.author.delete({
      where: { id: existingAuthor.id },
    });

    await cache.invalidateResource(workspaceId, "authors");
    await cache.invalidateResource(workspaceId, "posts");

    return c.json({ id: existingAuthor.id }, 200 as const);
  } catch (error) {
    console.error("Error deleting author:", error);
    return c.json(
      {
        error: "Failed to delete author",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500 as const
    );
  }
});

export default authors;
