import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createRecordId } from "@marble/db/id";
import {
  authorSocial,
  author as authorTable,
  post,
  postToAuthor,
  subscription,
} from "@marble/db/schema";
import { toAuthorPayload, withChanges } from "@marble/events";
import { getWorkspacePlan, PLAN_LIMITS } from "@marble/utils";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { cacheKey, createCacheClient, hashQueryParams } from "@/lib/cache";
import { emitEvent } from "@/lib/events";
import { requireWorkspaceId } from "@/lib/workspace";
import {
  AuthorResponseSchema,
  AuthorsListResponseSchema,
  CreateAuthorBodySchema,
  CreateAuthorResponseSchema,
  UpdateAuthorBodySchema,
} from "@/schemas/authors";
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
import type { ApiKeyApp } from "@/types/env";

const authors = new OpenAPIHono<ApiKeyApp>();

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
  const workspaceId = requireWorkspaceId(c);
  const db = c.get("db");
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
  const totalAuthors = await cache.getOrSetCount(countCacheKey, async () => {
    const [result] = await db
      .select({
        value: sql<number>`count(distinct ${authorTable.id})`,
      })
      .from(authorTable)
      .innerJoin(postToAuthor, eq(postToAuthor.a, authorTable.id))
      .innerJoin(post, eq(post.id, postToAuthor.b))
      .where(
        and(
          eq(authorTable.workspaceId, workspaceId),
          eq(post.status, "published")
        )
      );

    return Number(result?.value ?? 0);
  });

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
    const authorsList = await cache.getOrSet(listCacheKey, async () => {
      const authorRows = await db
        .selectDistinct({
          id: authorTable.id,
          name: authorTable.name,
          image: authorTable.image,
          slug: authorTable.slug,
          bio: authorTable.bio,
          role: authorTable.role,
        })
        .from(authorTable)
        .innerJoin(postToAuthor, eq(postToAuthor.a, authorTable.id))
        .innerJoin(post, eq(post.id, postToAuthor.b))
        .where(
          and(
            eq(authorTable.workspaceId, workspaceId),
            eq(post.status, "published")
          )
        )
        .orderBy(asc(authorTable.name))
        .limit(limit)
        .offset(authorsToSkip);

      if (authorRows.length === 0) {
        return [];
      }

      const authorIds = authorRows.map((entry) => entry.id);

      const [socialRows, postCountRows] = await Promise.all([
        db.query.author.findMany({
          where: inArray(authorTable.id, authorIds),
          columns: { id: true },
          with: {
            socials: {
              columns: {
                url: true,
                platform: true,
              },
            },
          },
        }),
        db
          .select({
            authorId: postToAuthor.a,
            postsCount: sql<number>`cast(count(*) as int)`,
          })
          .from(postToAuthor)
          .innerJoin(post, eq(post.id, postToAuthor.b))
          .where(
            and(
              inArray(postToAuthor.a, authorIds),
              eq(post.status, "published")
            )
          )
          .groupBy(postToAuthor.a),
      ]);

      const socialsByAuthorId = new Map(
        socialRows.map((entry) => [entry.id, entry.socials])
      );
      const postCountsByAuthorId = new Map(
        postCountRows.map((entry) => [entry.authorId, entry.postsCount])
      );

      return authorRows.map((entry) => ({
        ...entry,
        socials: socialsByAuthorId.get(entry.id) ?? [],
        postsCount: postCountsByAuthorId.get(entry.id) ?? 0,
      }));
    });

    const transformedAuthors = authorsList.map(
      ({ postsCount, ...authorEntry }) => ({
        ...authorEntry,
        count: {
          posts: postsCount,
        },
      })
    );

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
  const workspaceId = requireWorkspaceId(c);
  const { identifier } = c.req.valid("param");
  const db = c.get("db");
  const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

  try {
    // Cache by identifier (slug or id)
    const singleCacheKey = cacheKey(workspaceId, "authors", identifier);

    const author = await cache.getOrSet(singleCacheKey, () =>
      db.query.author.findFirst({
        where: and(
          eq(authorTable.workspaceId, workspaceId),
          or(eq(authorTable.id, identifier), eq(authorTable.slug, identifier))
        ),
        columns: {
          id: true,
          name: true,
          image: true,
          slug: true,
          bio: true,
          role: true,
        },
        with: {
          socials: {
            columns: {
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

const createAuthorRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Authors"],
  summary: "Create author",
  description:
    "Create a new author. Requires a private API key. Plan limits apply.",
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

// ─── POST /v1/authors ───

authors.openapi(createAuthorRoute, async (c) => {
  try {
    const db = c.get("db");
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    // Check plan limits before creating another author.
    const subscriptions = await db
      .select({
        plan: subscription.plan,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
      })
      .from(subscription)
      .where(
        and(
          eq(subscription.workspaceId, workspaceId),
          or(
            eq(subscription.status, "active"),
            eq(subscription.status, "trialing"),
            and(
              eq(subscription.status, "canceled"),
              eq(subscription.cancelAtPeriodEnd, true),
              gt(subscription.currentPeriodEnd, new Date())
            )
          )
        )
      )
      .orderBy(desc(subscription.createdAt))
      .limit(1);

    const activeSub = subscriptions[0];
    const plan = getWorkspacePlan(activeSub);
    const planLimits = PLAN_LIMITS[plan];

    if (planLimits.maxAuthors !== Number.MAX_SAFE_INTEGER) {
      const [authorsCount] = await db
        .select({ value: count() })
        .from(authorTable)
        .where(
          and(
            eq(authorTable.workspaceId, workspaceId),
            eq(authorTable.isActive, true)
          )
        );

      const existingCount = authorsCount?.value ?? 0;

      if (existingCount >= planLimits.maxAuthors) {
        return c.json(
          {
            error: "Author limit reached",
            message: `Your current plan allows ${planLimits.maxAuthors} author${planLimits.maxAuthors === 1 ? "" : "s"}.`,
          },
          403 as const
        );
      }
    }

    // Check slug uniqueness
    const existingAuthor = await db.query.author.findFirst({
      where: and(
        eq(authorTable.workspaceId, workspaceId),
        eq(authorTable.slug, body.slug)
      ),
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

    const author = await db.transaction(async (tx) => {
      const [authorRow] = await tx
        .insert(authorTable)
        .values({
          id: createRecordId(),
          name: body.name,
          slug: body.slug,
          bio: body.bio ?? null,
          role: body.role ?? null,
          email: body.email ?? null,
          image: body.image ?? null,
          workspaceId,
          updatedAt: new Date(),
        })
        .returning({
          id: authorTable.id,
          name: authorTable.name,
          slug: authorTable.slug,
          bio: authorTable.bio,
          role: authorTable.role,
          image: authorTable.image,
        });

      if (!authorRow) {
        throw new Error("Failed to create author");
      }

      const socialRows =
        body.socials && body.socials.length > 0
          ? await tx
              .insert(authorSocial)
              .values(
                body.socials.map((social) => ({
                  id: createRecordId(),
                  authorId: authorRow.id,
                  url: social.url,
                  platform: social.platform,
                  updatedAt: new Date(),
                }))
              )
              .returning({
                url: authorSocial.url,
                platform: authorSocial.platform,
              })
          : [];

      return { ...authorRow, socials: socialRows };
    });

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "authors"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "author_created",
        workspaceId,
        resourceType: "author",
        resourceId: author.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: toAuthorPayload(author),
      }).catch((error) => {
        console.error("[authors.create] Failed to emit author_created:", error);
      })
    );

    return c.json({ author }, 201 as const);
  } catch (error) {
    console.error("Error creating author:", error);
    return c.json(
      {
        error: "Failed to create author",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

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

// ─── PATCH /v1/authors/{identifier} ───

authors.openapi(updateAuthorRoute, async (c) => {
  try {
    const db = c.get("db");
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    const existingAuthor = await db.query.author.findFirst({
      where: and(
        eq(authorTable.workspaceId, workspaceId),
        or(eq(authorTable.id, identifier), eq(authorTable.slug, identifier))
      ),
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
      const slugConflict = await db.query.author.findFirst({
        where: and(
          eq(authorTable.slug, body.slug),
          eq(authorTable.workspaceId, workspaceId),
          ne(authorTable.id, existingAuthor.id)
        ),
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

    const updatedAuthor = await db.transaction(async (tx) => {
      const [authorRow] = await tx
        .update(authorTable)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.slug !== undefined && { slug: body.slug }),
          ...(body.bio !== undefined && { bio: body.bio }),
          ...(body.role !== undefined && { role: body.role }),
          ...(body.email !== undefined && { email: body.email || null }),
          ...(body.image !== undefined && { image: body.image }),
          updatedAt: new Date(),
        })
        .where(eq(authorTable.id, existingAuthor.id))
        .returning({
          id: authorTable.id,
          name: authorTable.name,
          slug: authorTable.slug,
          bio: authorTable.bio,
          role: authorTable.role,
          image: authorTable.image,
        });

      if (!authorRow) {
        throw new Error("Author not found");
      }

      // Socials: delete all existing and recreate (same pattern as CMS)
      if (body.socials !== undefined) {
        await tx
          .delete(authorSocial)
          .where(eq(authorSocial.authorId, existingAuthor.id));

        const socialRows =
          body.socials.length > 0
            ? await tx
                .insert(authorSocial)
                .values(
                  body.socials.map((social) => ({
                    id: createRecordId(),
                    authorId: existingAuthor.id,
                    url: social.url,
                    platform: social.platform,
                    updatedAt: new Date(),
                  }))
                )
                .returning({
                  url: authorSocial.url,
                  platform: authorSocial.platform,
                })
            : [];

        return { ...authorRow, socials: socialRows };
      }

      const socialRows = await tx
        .select({
          url: authorSocial.url,
          platform: authorSocial.platform,
        })
        .from(authorSocial)
        .where(eq(authorSocial.authorId, existingAuthor.id));

      return { ...authorRow, socials: socialRows };
    });

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "authors"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "author_updated",
        workspaceId,
        resourceType: "author",
        resourceId: updatedAuthor.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: withChanges(toAuthorPayload(updatedAuthor), Object.keys(body)),
      }).catch((error) => {
        console.error("[authors.update] Failed to emit author_updated:", error);
      })
    );

    return c.json({ author: updatedAuthor }, 200 as const);
  } catch (error) {
    console.error("Error updating author:", error);
    return c.json(
      {
        error: "Failed to update author",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

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

// ─── DELETE /v1/authors/{identifier} ───

authors.openapi(deleteAuthorRoute, async (c) => {
  try {
    const db = c.get("db");
    const workspaceId = requireWorkspaceId(c);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingAuthor = await db.query.author.findFirst({
      where: and(
        eq(authorTable.workspaceId, workspaceId),
        or(eq(authorTable.id, identifier), eq(authorTable.slug, identifier))
      ),
      with: {
        socials: {
          columns: {
            url: true,
            platform: true,
          },
        },
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

    await db.delete(authorTable).where(eq(authorTable.id, existingAuthor.id));

    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "authors"));
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "author_deleted",
        workspaceId,
        resourceType: "author",
        resourceId: existingAuthor.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: toAuthorPayload(existingAuthor),
      }).catch((error) => {
        console.error("[authors.delete] Failed to emit author_deleted:", error);
      })
    );

    return c.json({ id: existingAuthor.id }, 200 as const);
  } catch (error) {
    console.error("Error deleting author:", error);
    return c.json(
      {
        error: "Failed to delete author",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

export default authors;
