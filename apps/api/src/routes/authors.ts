import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@marble/db/workers";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { requireWorkspaceId } from "../lib/workspace";
import {
  AuthorsListResponseSchema,
  SingleAuthorResponseSchema,
} from "../schemas/authors";
import {
  ErrorSchema,
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
  summary: "Get an author",
  description: "Get a single author by ID or slug",
  request: {
    params: AuthorParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: SingleAuthorResponseSchema } },
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

export default authors;
