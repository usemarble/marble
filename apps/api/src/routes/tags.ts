import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createRecordId } from "@marble/db/id";
import { post, postToTag, tag as tagTable } from "@marble/db/schema";
import { toTagPayload, withChanges } from "@marble/events";
import { and, asc, count, eq, ne, or, sql } from "drizzle-orm";
import { cacheKey, createCacheClient, hashQueryParams } from "@/lib/cache";
import { emitEvent } from "@/lib/events";
import { requireWorkspaceId } from "@/lib/workspace";
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
} from "@/schemas/common";
import {
  CreateTagBodySchema,
  CreateTagResponseSchema,
  TagResponseSchema,
  TagsListResponseSchema,
  UpdateTagBodySchema,
} from "@/schemas/tags";
import type { ApiKeyApp } from "@/types/env";

const tags = new OpenAPIHono<ApiKeyApp>();

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
  const db = c.get("db");
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
  const totalTags = await cache.getOrSetCount(countCacheKey, async () => {
    const [result] = await db
      .select({ value: count() })
      .from(tagTable)
      .where(eq(tagTable.workspaceId, workspaceId));

    return result?.value ?? 0;
  });

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

  const tagsList = await cache.getOrSet(listCacheKey, async () =>
    db
      .select({
        id: tagTable.id,
        name: tagTable.name,
        slug: tagTable.slug,
        description: tagTable.description,
        postsCount: sql<number>`cast(count(${post.id}) as int)`,
      })
      .from(tagTable)
      .leftJoin(postToTag, eq(postToTag.b, tagTable.id))
      .leftJoin(
        post,
        and(eq(post.id, postToTag.a), eq(post.status, "published"))
      )
      .where(eq(tagTable.workspaceId, workspaceId))
      .groupBy(tagTable.id)
      .orderBy(asc(tagTable.name), asc(tagTable.id))
      .limit(limit)
      .offset(tagsToSkip)
  );

  const transformedTags = tagsList.map(({ postsCount, ...rest }) => ({
    ...rest,
    count: {
      posts: postsCount,
    },
  }));

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
    const db = c.get("db");
    const workspaceId = requireWorkspaceId(c);
    const { identifier } = c.req.valid("param");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    // Cache by identifier (slug or id)
    const singleCacheKey = cacheKey(workspaceId, "tags", identifier);

    const tagRows = await cache.getOrSet(singleCacheKey, async () =>
      db
        .select({
          id: tagTable.id,
          name: tagTable.name,
          slug: tagTable.slug,
          description: tagTable.description,
          postsCount: sql<number>`cast(count(${post.id}) as int)`,
        })
        .from(tagTable)
        .leftJoin(postToTag, eq(postToTag.b, tagTable.id))
        .leftJoin(
          post,
          and(eq(post.id, postToTag.a), eq(post.status, "published"))
        )
        .where(
          and(
            eq(tagTable.workspaceId, workspaceId),
            or(eq(tagTable.id, identifier), eq(tagTable.slug, identifier))
          )
        )
        .groupBy(tagTable.id)
        .limit(1)
    );

    const tag = tagRows[0];

    if (!tag) {
      return c.json(
        {
          error: "Tag not found",
          message: "The requested tag does not exist",
        },
        404 as const
      );
    }

    const { postsCount, ...rest } = tag;
    const transformedTag = {
      ...rest,
      count: {
        posts: postsCount,
      },
    };

    return c.json({ tag: transformedTag }, 200 as const);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return c.json({ error: "Failed to fetch tag" }, 500 as const);
  }
});

tags.openapi(createTagRoute, async (c) => {
  try {
    const db = c.get("db");
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    // Check for slug uniqueness within workspace
    const existingTag = await db.query.tag.findFirst({
      where: and(
        eq(tagTable.slug, body.slug),
        eq(tagTable.workspaceId, workspaceId)
      ),
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

    const [tagCreated] = await db
      .insert(tagTable)
      .values({
        id: createRecordId(),
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        workspaceId,
        updatedAt: new Date(),
      })
      .returning({
        id: tagTable.id,
        name: tagTable.name,
        slug: tagTable.slug,
        description: tagTable.description,
      });

    if (!tagCreated) {
      return c.json(
        {
          error: "Failed to create tag",
          message: "An unexpected error occurred",
        },
        500 as const
      );
    }

    // Invalidate cache for tags and posts
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "tag_created",
        workspaceId,
        resourceType: "tag",
        resourceId: tagCreated.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: toTagPayload(tagCreated),
      }).catch((error) => {
        console.error("[tags.create] Failed to emit tag_created:", error);
      })
    );

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
    const db = c.get("db");
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    // Find the tag first
    const existingTag = await db.query.tag.findFirst({
      where: and(
        eq(tagTable.workspaceId, workspaceId),
        or(eq(tagTable.id, identifier), eq(tagTable.slug, identifier))
      ),
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
      const slugConflict = await db.query.tag.findFirst({
        where: and(
          eq(tagTable.slug, body.slug),
          eq(tagTable.workspaceId, workspaceId),
          ne(tagTable.id, existingTag.id)
        ),
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

    const [tagUpdated] = await db
      .update(tagTable)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        updatedAt: new Date(),
      })
      .where(eq(tagTable.id, existingTag.id))
      .returning({
        id: tagTable.id,
        name: tagTable.name,
        slug: tagTable.slug,
        description: tagTable.description,
      });

    if (!tagUpdated) {
      return c.json(
        {
          error: "Failed to update tag",
          message: "An unexpected error occurred",
        },
        500 as const
      );
    }

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "tag_updated",
        workspaceId,
        resourceType: "tag",
        resourceId: tagUpdated.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: withChanges(toTagPayload(tagUpdated), Object.keys(body)),
      }).catch((error) => {
        console.error("[tags.update] Failed to emit tag_updated:", error);
      })
    );

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
    const db = c.get("db");
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingTag = await db.query.tag.findFirst({
      where: and(
        eq(tagTable.workspaceId, workspaceId),
        or(eq(tagTable.id, identifier), eq(tagTable.slug, identifier))
      ),
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

    const deletedTags = await db
      .delete(tagTable)
      .where(eq(tagTable.id, existingTag.id))
      .returning({ id: tagTable.id });

    if (deletedTags.length === 0) {
      return c.json(
        {
          error: "Tag not found",
          message: "The requested tag does not exist",
        },
        404 as const
      );
    }

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "tag_deleted",
        workspaceId,
        resourceType: "tag",
        resourceId: existingTag.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: toTagPayload(existingTag),
      }).catch((error) => {
        console.error("[tags.delete] Failed to emit tag_deleted:", error);
      })
    );

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
