import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@marble/db/workers";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { requireWorkspaceId } from "../lib/workspace";
import {
  ErrorSchema,
  LimitQuerySchema,
  NotFoundSchema,
  PageNotFoundSchema,
  PageQuerySchema,
  ServerErrorSchema,
} from "../schemas/common";
import {
  SingleTagResponseSchema,
  TagsListResponseSchema,
} from "../schemas/tags";
import type { Env } from "../types/env";

const tags = new OpenAPIHono<{ Bindings: Env }>();

const TagsQuerySchema = z.object({
  limit: LimitQuerySchema,
  page: PageQuerySchema,
});

const TagParamsSchema = z.object({
  identifier: z.string().openapi({
    param: { name: "identifier", in: "path" },
    example: "javascript",
    description: "Tag ID or slug",
  }),
});

const listTagsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Tags"],
  summary: "List tags",
  description: "Get a paginated list of tags",
  request: {
    query: TagsQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: TagsListResponseSchema } },
      description: "Paginated list of tags",
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

const getTagRoute = createRoute({
  method: "get",
  path: "/{identifier}",
  tags: ["Tags"],
  summary: "Get a tag",
  description: "Get a single tag by ID or slug",
  request: {
    params: TagParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: SingleTagResponseSchema } },
      description: "The requested tag",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Tag not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

tags.openapi(listTagsRoute, async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  const workspaceId = requireWorkspaceId(c);
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  const { limit, page } = c.req.valid("query");

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

  return c.json(
    {
      tags: transformedTags,
      pagination: {
        limit,
        currentPage: page,
        nextPage,
        previousPage: prevPage,
        totalPages,
        totalItems: totalTags,
      },
    },
    200 as const
  );
});

tags.openapi(getTagRoute, async (c) => {
  try {
    const db = createClient(c.env.DATABASE_URL);
    const workspaceId = requireWorkspaceId(c);
    const { identifier } = c.req.valid("param");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

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
        404 as const
      );
    }

    // Transform _count to count
    const { _count, ...rest } = tag;
    const transformedTag = {
      ...rest,
      count: _count,
    };

    return c.json({ tag: transformedTag }, 200 as const);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return c.json({ error: "Failed to fetch tag" }, 500 as const);
  }
});

export default tags;
