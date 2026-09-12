import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createRecordId } from "@marble/db/id";
import {
  author,
  category,
  fieldOption,
  field as fieldTable,
  fieldValue,
  post as postTable,
  postToAuthor,
  postToTag,
  tag,
} from "@marble/db/schema";
import { toPostPayload, withChanges } from "@marble/events";
import {
  EMPTY_TIPTAP_DOC,
  htmlToMarkdown,
  htmlToTiptap,
  normalizePostContent,
} from "@marble/parser";
import { sanitizeHtml } from "@marble/utils/sanitize";
import { and, asc, count, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { cacheKey, createCacheClient, hashQueryParams } from "@/lib/cache";
import type { DbClient } from "@/lib/db";
import { emitEvent } from "@/lib/events";
import { resolveCustomFieldValuesByKey } from "@/lib/fields";
import {
  buildFieldsObject,
  buildPostsListWhere,
  buildStatusFilter,
} from "@/lib/posts";
import { requireWorkspaceId } from "@/lib/workspace";
import {
  ConflictSchema,
  DeleteResponseSchema,
  ErrorSchema,
  ForbiddenSchema,
  NotFoundSchema,
  PageNotFoundSchema,
  ServerErrorSchema,
} from "@/schemas/common";
import {
  CreatePostBodySchema,
  CreatePostResponseSchema,
  PostParamsSchema,
  PostResponseSchema,
  PostsListResponseSchema,
  PostsQuerySchema,
  SinglePostQuerySchema,
  UpdatePostBodySchema,
  UpdatePostResponseSchema,
} from "@/schemas/posts";
import type { ApiKeyApp } from "@/types/env";

const posts = new OpenAPIHono<ApiKeyApp>();

const postListColumns = {
  id: true,
  slug: true,
  title: true,
  status: true,
  content: true,
  featured: true,
  coverImage: true,
  description: true,
  publishedAt: true,
  updatedAt: true,
} as const;

const postListWith = {
  category: {
    columns: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  },
  tags: {
    with: {
      tag: {
        columns: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      },
    },
  },
  authors: {
    with: {
      author: {
        columns: {
          id: true,
          name: true,
          image: true,
          bio: true,
          role: true,
          slug: true,
        },
        with: {
          socials: {
            columns: {
              url: true,
              platform: true,
            },
          },
        },
      },
    },
  },
  fieldValues: {
    columns: {
      value: true,
    },
    with: {
      field: {
        columns: {
          key: true,
          type: true,
        },
      },
    },
  },
} as const;

function flattenPostRelations<
  T extends {
    tags: Array<{
      tag: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
      };
    }>;
    authors: Array<{
      author: {
        id: string;
        name: string;
        image: string | null;
        bio: string | null;
        role: string | null;
        slug: string;
        socials: Array<{ url: string; platform: string }>;
      };
    }>;
  },
>(postRow: T) {
  return {
    ...postRow,
    tags: postRow.tags.map((row) => row.tag),
    authors: postRow.authors.map((row) => row.author),
  };
}

async function writePostCustomFieldValues(
  tx: Parameters<Parameters<DbClient["transaction"]>[0]>[0],
  workspaceId: string,
  postId: string,
  writes: Array<{ fieldId: string; value: string | null }>
) {
  const now = new Date();
  const fieldIdsToDelete = writes
    .filter((write) => write.value === null)
    .map((write) => write.fieldId);
  const valuesToUpsert = writes.filter(
    (write): write is { fieldId: string; value: string } => write.value !== null
  );

  if (fieldIdsToDelete.length > 0) {
    await tx
      .delete(fieldValue)
      .where(
        and(
          eq(fieldValue.postId, postId),
          inArray(fieldValue.fieldId, fieldIdsToDelete),
          eq(fieldValue.workspaceId, workspaceId)
        )
      );
  }

  if (valuesToUpsert.length > 0) {
    await tx
      .insert(fieldValue)
      .values(
        valuesToUpsert.map(({ fieldId, value }) => ({
          id: createRecordId(),
          postId,
          fieldId,
          workspaceId,
          value,
          updatedAt: now,
        }))
      )
      .onConflictDoUpdate({
        target: [fieldValue.postId, fieldValue.fieldId],
        set: {
          workspaceId,
          value: sql.raw(`excluded."${fieldValue.value.name}"`),
          updatedAt: now,
        },
      });
  }
}

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
    const workspaceId = requireWorkspaceId(c);
    const db = c.get("db");
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

    const where = buildPostsListWhere(db, workspaceId, {
      categories,
      excludeCategories,
      tags,
      excludeTags,
      query,
      featured,
      status,
    });

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
    const totalPosts = await cache.getOrSetCount(countCacheKey, async () => {
      const [result] = await db
        .select({ count: count() })
        .from(postTable)
        .where(where);
      return result?.count ?? 0;
    });

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

    const postsToSkip = (page - 1) * limit;
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;
    const postOrderBy =
      order === "asc"
        ? [asc(postTable.publishedAt), asc(postTable.id)]
        : [desc(postTable.publishedAt), desc(postTable.id)];

    const [postsData, workspaceFields] = await Promise.all([
      cache.getOrSet(listCacheKey, async () => {
        const postIds = await db
          .select({ id: postTable.id })
          .from(postTable)
          .where(where)
          .orderBy(...postOrderBy)
          .limit(limit)
          .offset(postsToSkip);

        if (postIds.length === 0) {
          return [];
        }

        return db.query.post.findMany({
          where: inArray(
            postTable.id,
            postIds.map(({ id }) => id)
          ),
          orderBy: postOrderBy,
          limit,
          columns: postListColumns,
          with: postListWith,
        });
      }),
      db.query.field.findMany({
        where: eq(fieldTable.workspaceId, workspaceId),
        columns: {
          key: true,
          type: true,
        },
      }),
    ]);

    const formattedPosts =
      format === "markdown"
        ? postsData.map((postRow) => ({
            ...flattenPostRelations(postRow),
            content: htmlToMarkdown(postRow.content || ""),
          }))
        : postsData.map((postRow) => flattenPostRelations(postRow));

    const postsWithFields = formattedPosts.map((postRow) => {
      const { fieldValues, ...rest } = postRow;
      return {
        ...rest,
        fields: buildFieldsObject(fieldValues || [], workspaceFields),
      };
    });

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
        posts: postsWithFields,
        pagination: paginationInfo,
      },
      200 as const
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json(
      {
        error: "Failed to fetch posts",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

posts.openapi(getPostRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const { identifier } = c.req.valid("param");
    const { format, status } = c.req.valid("query");
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    const statusCondition = buildStatusFilter(status);
    const where = and(
      eq(postTable.workspaceId, workspaceId),
      or(eq(postTable.slug, identifier), eq(postTable.id, identifier)),
      statusCondition
    );

    // Cache by identifier (slug or id), format, and status
    const singleCacheKey = cacheKey(
      workspaceId,
      "posts",
      identifier,
      hashQueryParams({ format, status })
    );

    const postRow = await cache.getOrSet(singleCacheKey, () =>
      db.query.post.findFirst({
        where,
        columns: postListColumns,
        with: postListWith,
      })
    );

    if (!postRow) {
      return c.json(
        {
          error: "Post not found",
          message:
            "The requested post does not exist or does not match the requested status",
        },
        404 as const
      );
    }

    const workspaceFields = await db.query.field.findMany({
      where: eq(fieldTable.workspaceId, workspaceId),
      columns: {
        key: true,
        type: true,
      },
    });

    const flattenedPost = flattenPostRelations(postRow);
    // Format post based on requested format
    const formattedPost =
      format === "markdown"
        ? {
            ...flattenedPost,
            content: htmlToMarkdown(flattenedPost.content || ""),
          }
        : flattenedPost;

    const { fieldValues, ...postRest } = formattedPost;
    const postWithFields = {
      ...postRest,
      fields: buildFieldsObject(fieldValues || [], workspaceFields),
    };

    return c.json({ post: postWithFields }, 200 as const);
  } catch (_error) {
    return c.json({ error: "Failed to fetch post" }, 500 as const);
  }
});

posts.openapi(createPostRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    // 1. Check slug uniqueness within workspace
    const existingPost = await db.query.post.findFirst({
      where: and(
        eq(postTable.slug, body.slug),
        eq(postTable.workspaceId, workspaceId)
      ),
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
    const categoryRow = await db.query.category.findFirst({
      where: and(
        eq(category.id, body.categoryId),
        eq(category.workspaceId, workspaceId)
      ),
    });

    if (!categoryRow) {
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
      const validTags = await db.query.tag.findMany({
        where: and(
          inArray(tag.id, body.tags),
          eq(tag.workspaceId, workspaceId)
        ),
        columns: { id: true },
      });

      validTagIds = validTags.map((tagRow) => tagRow.id);

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
      const validAuthors = await db.query.author.findMany({
        where: and(
          inArray(author.id, body.authors),
          eq(author.workspaceId, workspaceId),
          eq(author.isActive, true)
        ),
        columns: { id: true },
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

      const validAuthorIds = validAuthors.map((authorRow) => authorRow.id);
      const invalidAuthorIds = body.authors.filter(
        (id) => !validAuthorIds.includes(id)
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

      const validAuthorIdSet = new Set(validAuthorIds);
      authorIds = Array.from(
        new Set(body.authors.filter((id) => validAuthorIdSet.has(id)))
      );
    } else {
      // Fallback: use the first workspace author
      const firstAuthor = await db.query.author.findFirst({
        where: and(
          eq(author.workspaceId, workspaceId),
          eq(author.isActive, true)
        ),
        orderBy: asc(author.createdAt),
        columns: { id: true },
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

    // 5. Resolve custom fields by field key
    const customFieldDefinitions = await db.query.field.findMany({
      where: eq(fieldTable.workspaceId, workspaceId),
      columns: {
        id: true,
        key: true,
        name: true,
        type: true,
        required: true,
      },
      with: {
        options: {
          columns: {
            value: true,
            label: true,
          },
          orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
        },
      },
    });

    const customFieldWrites = resolveCustomFieldValuesByKey(
      customFieldDefinitions,
      body.fields,
      "create"
    );

    if (!customFieldWrites.success) {
      return c.json(customFieldWrites.error, 400 as const);
    }

    // 6. Determine publishedAt
    const publishedAt = body.publishedAt
      ? new Date(body.publishedAt)
      : new Date();

    const normalizedContent = await normalizePostContent(body.content);
    const sanitizedContent = sanitizeHtml(normalizedContent.html);
    let contentJson = EMPTY_TIPTAP_DOC;

    try {
      contentJson = htmlToTiptap(sanitizedContent);
    } catch (error) {
      console.error("[Posts] Failed to convert HTML to TipTap JSON:", error);
      contentJson = EMPTY_TIPTAP_DOC;
    }

    // 7. Create the post
    const postCreated = await db.transaction(async (tx) => {
      const postId = createRecordId();
      const now = new Date();

      const [createdPost] = await tx
        .insert(postTable)
        .values({
          id: postId,
          title: body.title,
          content: sanitizedContent,
          contentJson,
          description: body.description,
          slug: body.slug,
          categoryId: body.categoryId,
          status: body.status,
          featured: body.featured ?? false,
          coverImage: body.coverImage ?? null,
          publishedAt,
          workspaceId,
          primaryAuthorId,
          updatedAt: now,
        })
        .returning({
          id: postTable.id,
          slug: postTable.slug,
          title: postTable.title,
          status: postTable.status,
          featured: postTable.featured,
          publishedAt: postTable.publishedAt,
          createdAt: postTable.createdAt,
        });

      if (!createdPost) {
        throw new Error("Failed to create post");
      }

      if (validTagIds.length > 0) {
        await tx.insert(postToTag).values(
          validTagIds.map((tagId) => ({
            a: createdPost.id,
            b: tagId,
          }))
        );
      }

      await tx.insert(postToAuthor).values(
        authorIds.map((authorId) => ({
          a: authorId,
          b: createdPost.id,
        }))
      );

      const fieldValueWrites = customFieldWrites.values.filter(
        (write) => write.value !== null
      );

      if (fieldValueWrites.length > 0) {
        await tx.insert(fieldValue).values(
          fieldValueWrites.map((write) => ({
            id: createRecordId(),
            postId: createdPost.id,
            fieldId: write.fieldId,
            workspaceId,
            value: write.value as string,
            updatedAt: now,
          }))
        );
      }

      return createdPost;
    });

    // 8. Invalidate cache
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "authors"));

    const apiKeyId = c.get("apiKeyId");
    const eventType =
      postCreated.status === "published" ? "post_published" : "post_created";
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: eventType,
        workspaceId,
        resourceType: "post",
        resourceId: postCreated.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: toPostPayload(postCreated),
      }).catch((error) => {
        console.error(`[posts.create] Failed to emit ${eventType}:`, error);
      })
    );

    return c.json({ post: postCreated }, 201 as const);
  } catch (error) {
    console.error("Error creating post:", error);
    return c.json(
      {
        error: "Failed to create post",
        message: "An unexpected error occurred",
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
    const workspaceId = requireWorkspaceId(c);
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    // 1. Find the existing post
    const existingPost = await db.query.post.findFirst({
      where: and(
        eq(postTable.workspaceId, workspaceId),
        or(eq(postTable.slug, identifier), eq(postTable.id, identifier))
      ),
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
      const slugConflict = await db.query.post.findFirst({
        where: and(
          eq(postTable.slug, body.slug),
          eq(postTable.workspaceId, workspaceId),
          ne(postTable.id, existingPost.id)
        ),
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
      const categoryRow = await db.query.category.findFirst({
        where: and(
          eq(category.id, body.categoryId),
          eq(category.workspaceId, workspaceId)
        ),
      });

      if (!categoryRow) {
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
    let validTagIds: string[] | undefined;
    if (body.tags !== undefined) {
      if (body.tags.length > 0) {
        const validTags = await db.query.tag.findMany({
          where: and(
            inArray(tag.id, body.tags),
            eq(tag.workspaceId, workspaceId)
          ),
          columns: { id: true },
        });

        validTagIds = validTags.map((tagRow) => tagRow.id);
        const invalidTagIds = body.tags.filter(
          (id) => !validTagIds?.includes(id)
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
      } else {
        // Empty array = remove all tags
        validTagIds = [];
      }
    }

    // 5. Validate authors if provided
    let authorIds: string[] | undefined;
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

      const validAuthors = await db.query.author.findMany({
        where: and(
          inArray(author.id, body.authors),
          eq(author.workspaceId, workspaceId),
          eq(author.isActive, true)
        ),
        columns: { id: true },
      });

      const validAuthorIds = validAuthors.map((authorRow) => authorRow.id);
      const invalidAuthorIds = body.authors.filter(
        (id) => !validAuthorIds.includes(id)
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

      const validAuthorIdSet = new Set(validAuthorIds);
      authorIds = Array.from(
        new Set(body.authors.filter((id) => validAuthorIdSet.has(id)))
      );
      primaryAuthorId = authorIds[0];
    }

    let customFieldWrites:
      | Array<{ fieldId: string; fieldType: string; value: string | null }>
      | undefined;

    // 6. Resolve custom fields by field key when provided
    if (body.fields !== undefined) {
      const customFieldDefinitions = await db.query.field.findMany({
        where: eq(fieldTable.workspaceId, workspaceId),
        columns: {
          id: true,
          key: true,
          name: true,
          type: true,
          required: true,
        },
        with: {
          options: {
            columns: {
              value: true,
              label: true,
            },
            orderBy: [asc(fieldOption.position), asc(fieldOption.createdAt)],
          },
        },
      });

      const resolvedCustomFields = resolveCustomFieldValuesByKey(
        customFieldDefinitions,
        body.fields,
        "update"
      );

      if (!resolvedCustomFields.success) {
        return c.json(resolvedCustomFields.error, 400 as const);
      }

      customFieldWrites = resolvedCustomFields.values;
    }

    // 7. Build update data
    const updateData: Partial<typeof postTable.$inferInsert> = {};
    if (body.title !== undefined) {
      updateData.title = body.title;
    }
    if (body.content !== undefined) {
      const normalizedContent = await normalizePostContent(body.content);
      const sanitizedContent = sanitizeHtml(normalizedContent.html);
      updateData.content = sanitizedContent;

      try {
        updateData.contentJson = htmlToTiptap(sanitizedContent);
      } catch (error) {
        console.error(
          "[Posts] Failed to convert updated HTML to TipTap JSON:",
          error
        );
        updateData.contentJson = EMPTY_TIPTAP_DOC;
      }
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
    if (primaryAuthorId) {
      updateData.primaryAuthorId = primaryAuthorId;
    }

    const shouldTouchPost =
      Object.keys(updateData).length > 0 ||
      validTagIds !== undefined ||
      authorIds !== undefined ||
      customFieldWrites !== undefined;

    if (!shouldTouchPost) {
      return c.json(
        {
          post: {
            id: existingPost.id,
            slug: existingPost.slug,
            title: existingPost.title,
            status: existingPost.status,
            featured: existingPost.featured,
            publishedAt: existingPost.publishedAt,
            updatedAt: existingPost.updatedAt,
          },
        },
        200 as const
      );
    }

    const postUpdated = await db.transaction(async (tx) => {
      const now = new Date();

      const [updatedPost] = await tx
        .update(postTable)
        .set({
          ...updateData,
          updatedAt: now,
        })
        .where(eq(postTable.id, existingPost.id))
        .returning({
          id: postTable.id,
          slug: postTable.slug,
          title: postTable.title,
          status: postTable.status,
          featured: postTable.featured,
          publishedAt: postTable.publishedAt,
          updatedAt: postTable.updatedAt,
        });

      if (!updatedPost) {
        throw new Error("Failed to update post");
      }

      if (validTagIds !== undefined) {
        await tx.delete(postToTag).where(eq(postToTag.a, existingPost.id));

        if (validTagIds.length > 0) {
          await tx.insert(postToTag).values(
            validTagIds.map((tagId) => ({
              a: existingPost.id,
              b: tagId,
            }))
          );
        }
      }

      if (authorIds !== undefined) {
        await tx
          .delete(postToAuthor)
          .where(eq(postToAuthor.b, existingPost.id));

        await tx.insert(postToAuthor).values(
          authorIds.map((authorId) => ({
            a: authorId,
            b: existingPost.id,
          }))
        );
      }

      if (customFieldWrites !== undefined) {
        await writePostCustomFieldValues(
          tx,
          workspaceId,
          existingPost.id,
          customFieldWrites
        );
      }

      return updatedPost;
    });

    // 8. Invalidate cache
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "authors"));

    // 9. Emit events
    const apiKeyId = c.get("apiKeyId");
    let eventType: "post_published" | "post_unpublished" | "post_updated";

    if (
      existingPost.status !== "published" &&
      postUpdated.status === "published"
    ) {
      eventType = "post_published";
    } else if (
      existingPost.status === "published" &&
      postUpdated.status !== "published"
    ) {
      eventType = "post_unpublished";
    } else {
      eventType = "post_updated";
    }

    const payload =
      eventType === "post_updated"
        ? withChanges(toPostPayload(postUpdated), Object.keys(body))
        : toPostPayload(postUpdated);
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: eventType,
        workspaceId,
        resourceType: "post",
        resourceId: postUpdated.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload,
      }).catch((error) => {
        console.error(`[posts.update] Failed to emit ${eventType}:`, error);
      })
    );

    return c.json({ post: postUpdated }, 200 as const);
  } catch (error) {
    console.error("Error updating post:", error);
    return c.json(
      {
        error: "Failed to update post",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

posts.openapi(deletePostRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingPost = await db.query.post.findFirst({
      where: and(
        eq(postTable.workspaceId, workspaceId),
        or(eq(postTable.slug, identifier), eq(postTable.id, identifier))
      ),
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

    await db.delete(postTable).where(eq(postTable.id, existingPost.id));

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "tags"));
    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "authors"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "post_deleted",
        workspaceId,
        resourceType: "post",
        resourceId: existingPost.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: toPostPayload(existingPost),
      }).catch((error) => {
        console.error("[posts.delete] Failed to emit post_deleted:", error);
      })
    );

    return c.json({ id: existingPost.id }, 200 as const);
  } catch (error) {
    console.error("Error deleting post:", error);
    return c.json(
      {
        error: "Failed to delete post",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

export default posts;
