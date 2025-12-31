import { createClient } from "@marble/db/workers";
import { Hono } from "hono";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { requireWorkspaceId } from "../lib/workspace";
import type { Env } from "../types/env";
import { TagQuerySchema, TagsQuerySchema } from "../validations/tags";

const tags = new Hono<{ Bindings: Env }>();

tags.get("/", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  const workspaceId = requireWorkspaceId(c);
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  const queryValidation = TagsQuerySchema.safeParse({
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
    "tags",
    "list",
    hashQueryParams({ limit }),
    "count"
  );

  // Cache count query separately (1 hour TTL, invalidated with posts)
  const totalTags = await cache.getOrSetCount(countCacheKey, () =>
    db.tag.count({
      where: {
        workspaceId,
      },
    })
  );

  // Generate cache key for data (includes page)
  const listCacheKey = cacheKey(
    workspaceId,
    "tags",
    "list",
    hashQueryParams({ page, limit })
  );

  const totalPages = Math.ceil(totalTags / limit);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const tagsToSkip = limit ? (page - 1) * limit : 0;

  // Validate page number
  if (page > totalPages && totalTags > 0) {
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

  const tagsList = await cache.getOrSet(listCacheKey, () =>
    db.tag.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            posts: {
              where: {
                status: "published",
              },
            },
          },
        },
      },
      take: limit,
      skip: tagsToSkip,
    })
  );

  // because I dont want prisma's ugly _count
  const transformedTags = tagsList.map((tag) => {
    const { _count, ...rest } = tag;
    return {
      ...rest,
      count: _count,
    };
  });

  return c.json({
    tags: transformedTags,
    pagination: {
      limit,
      currentPage: page,
      nextPage,
      previousPage: prevPage,
      totalPages,
      totalItems: totalTags,
    },
  });
});

tags.get("/:identifier", async (c) => {
  try {
    const db = createClient(c.env.DATABASE_URL);
    const workspaceId = requireWorkspaceId(c);
    const identifier = c.req.param("identifier");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    const queryValidation = TagQuerySchema.safeParse({
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

    // Cache by identifier (slug or id)
    const singleCacheKey = cacheKey(workspaceId, "tags", identifier);

    // First get the tag
    const tag = await cache.getOrSet(singleCacheKey, () =>
      db.tag.findFirst({
        where: {
          workspaceId,
          OR: [{ id: identifier }, { slug: identifier }],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: {
            select: {
              posts: {
                where: {
                  status: "published",
                },
              },
            },
          },
        },
      })
    );

    if (!tag) {
      return c.json(
        {
          error: "Tag not found",
          message: "The requested tag does not exist",
        },
        404
      );
    }

    // Transform _count to count
    const { _count, ...rest } = tag;
    const transformedTag = {
      ...rest,
      count: _count,
    };

    return c.json(transformedTag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return c.json({ error: "Failed to fetch tag" }, 500);
  }
});

export default tags;
