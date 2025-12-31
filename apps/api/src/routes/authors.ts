import { createClient } from "@marble/db/workers";
import { Hono } from "hono";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { requireWorkspaceId } from "../lib/workspace";
import type { Env } from "../types/env";
import { AuthorQuerySchema, AuthorsQuerySchema } from "../validations/authors";

const authors = new Hono<{ Bindings: Env }>();

authors.get("/", async (c) => {
  const url = c.env.DATABASE_URL;
  const workspaceId = requireWorkspaceId(c);
  const db = createClient(url);
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  // Validate query parameters
  const queryValidation = AuthorsQuerySchema.safeParse({
    limit: c.req.query("limit"),
    page: c.req.query("page"),
  });

  if (!queryValidation.success) {
    return c.json(
      {
        error: "Invalid query parameters",
        details: queryValidation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
      400
    );
  }

  const { limit, page } = queryValidation.data;

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
        error: "Invalid page number",
        details: {
          message: `Page ${page} does not exist.`,
          totalPages,
          requestedPage: page,
        },
      },
      400
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

    return c.json({
      authors: transformedAuthors,
      pagination: {
        limit,
        currentPage: page,
        nextPage,
        previousPage: prevPage,
        totalPages,
        totalItems: totalAuthors,
      },
    });
  } catch (_error) {
    return c.json({ error: "Failed to fetch authors" }, 500);
  }
});

authors.get("/:identifier", async (c) => {
  const url = c.env.DATABASE_URL;
  const workspaceId = requireWorkspaceId(c);
  const identifier = c.req.param("identifier");
  const db = createClient(url);
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  const queryValidation = AuthorQuerySchema.safeParse({
    limit: c.req.query("limit"),
    page: c.req.query("page"),
  });

  if (!queryValidation.success) {
    return c.json(
      {
        error: "Invalid query parameters",
        details: queryValidation.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
      400
    );
  }

  const { limit, page } = queryValidation.data;

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
        404
      );
    }

    return c.json({ author });
  } catch (_error) {
    return c.json({ error: "Failed to fetch author" }, 500);
  }
});

export default authors;
