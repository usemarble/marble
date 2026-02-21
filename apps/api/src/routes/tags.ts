import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { createDbClient } from "../lib/db";
import { requireWorkspaceId } from "../lib/workspace";
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
import {
  CreateTagBodySchema,
  CreateTagResponseSchema,
  TagResponseSchema,
  TagsListResponseSchema,
  UpdateTagBodySchema,
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
  summary: "Get tag",
  description: "Get a single tag by ID or slug",
  request: {
    params: TagParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: TagResponseSchema } },
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

const createTagRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Tags"],
  summary: "Create tag",
  description: "Create a new tag. Requires a private API key.",
  request: {
    body: {
      content: { "application/json": { schema: CreateTagBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: CreateTagResponseSchema } },
      description: "Tag created successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Invalid request body",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Tag with this slug already exists",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

tags.openapi(listTagsRoute, async (c) => {
  const db = createDbClient(c.env);
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
    const db = createDbClient(c.env);
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

tags.openapi(createTagRoute, async (c) => {
  try {
    const db = createDbClient(c.env);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    // Check for slug uniqueness within workspace
    const existingTag = await db.tag.findFirst({
      where: {
        slug: body.slug,
        workspaceId,
      },
    });

    if (existingTag) {
      return c.json(
        {
          error: "Slug already in use",
          message: "A tag with this slug already exists in this workspace",
        },
        409 as const
      );
    }

    const tagCreated = await db.tag.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    // Invalidate cache for tags and posts
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    return c.json({ tag: tagCreated }, 201 as const);
  } catch (error) {
    console.error("Error creating tag:", error);
    return c.json(
      {
        error: "Failed to create tag",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

const updateTagRoute = createRoute({
  method: "patch",
  path: "/{identifier}",
  tags: ["Tags"],
  summary: "Update tag",
  description:
    "Update an existing tag by ID or slug. Requires a private API key.",
  request: {
    params: TagParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateTagBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: CreateTagResponseSchema } },
      description: "Tag updated successfully",
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
      description: "Tag not found",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Tag with this slug already exists",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const deleteTagRoute = createRoute({
  method: "delete",
  path: "/{identifier}",
  tags: ["Tags"],
  summary: "Delete tag",
  description: "Delete a tag by ID or slug. Requires a private API key.",
  request: {
    params: TagParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeleteResponseSchema } },
      description: "Tag deleted successfully",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
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

tags.openapi(updateTagRoute, async (c) => {
  try {
    const db = createDbClient(c.env);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    // Find the tag first
    const existingTag = await db.tag.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });

    if (!existingTag) {
      return c.json(
        {
          error: "Tag not found",
          message: "The requested tag does not exist",
        },
        404 as const
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existingTag.slug) {
      const slugConflict = await db.tag.findFirst({
        where: {
          slug: body.slug,
          workspaceId,
          id: { not: existingTag.id },
        },
      });

      if (slugConflict) {
        return c.json(
          {
            error: "Slug already in use",
            message: "A tag with this slug already exists in this workspace",
          },
          409 as const
        );
      }
    }

    const tagUpdated = await db.tag.update({
      where: { id: existingTag.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    return c.json({ tag: tagUpdated }, 200 as const);
  } catch (error) {
    console.error("Error updating tag:", error);
    return c.json(
      {
        error: "Failed to update tag",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

tags.openapi(deleteTagRoute, async (c) => {
  try {
    const db = createDbClient(c.env);
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingTag = await db.tag.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { slug: identifier }],
      },
    });

    if (!existingTag) {
      return c.json(
        {
          error: "Tag not found",
          message: "The requested tag does not exist",
        },
        404 as const
      );
    }

    await db.tag.delete({
      where: { id: existingTag.id },
    });

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    return c.json({ id: existingTag.id }, 200 as const);
  } catch (error) {
    console.error("Error deleting tag:", error);
    return c.json(
      {
        error: "Failed to delete tag",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

export default tags;
