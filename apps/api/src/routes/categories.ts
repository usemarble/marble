import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createRecordId } from "@marble/db/id";
import { category as categoryTable, post } from "@marble/db/schema";
import { toCategoryPayload, withChanges } from "@marble/events";
import { and, asc, count, eq, ne, or, sql } from "drizzle-orm";
import { cacheKey, createCacheClient, hashQueryParams } from "@/lib/cache";
import { emitEvent } from "@/lib/events";
import { requireWorkspaceId } from "@/lib/workspace";
import {
  CategoriesListResponseSchema,
  CategoryResponseSchema,
  CreateCategoryBodySchema,
  CreateCategoryResponseSchema,
  UpdateCategoryBodySchema,
} from "@/schemas/categories";
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

const categories = new OpenAPIHono<ApiKeyApp>();

const CategoriesQuerySchema = z.object({
  limit: LimitQuerySchema,
  page: PageQuerySchema,
});

const CategoryParamsSchema = z.object({
  identifier: z.string().openapi({
    param: { name: "identifier", in: "path" },
    example: "technology",
    description: "Category ID or slug",
  }),
});

const listCategoriesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Categories"],
  summary: "List categories",
  description: "Get a paginated list of categories",
  request: {
    query: CategoriesQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: CategoriesListResponseSchema } },
      description: "Paginated list of categories",
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

const getCategoryRoute = createRoute({
  method: "get",
  path: "/{identifier}",
  tags: ["Categories"],
  summary: "Get category",
  description: "Get a single category by ID or slug",
  request: {
    params: CategoryParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: CategoryResponseSchema } },
      description: "The requested category",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Category not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const createCategoryRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Categories"],
  summary: "Create category",
  description: "Create a new category. Requires a private API key.",
  request: {
    body: {
      content: { "application/json": { schema: CreateCategoryBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        "application/json": { schema: CreateCategoryResponseSchema },
      },
      description: "Category created successfully",
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
      description: "Category with this slug already exists",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

categories.openapi(listCategoriesRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    const { limit, page } = c.req.valid("query");

    // Generate cache key for count (exclude page - it doesn't affect count)
    const countCacheKey = cacheKey(
      workspaceId,
      "categories",
      "list",
      hashQueryParams({ limit }),
      "count"
    );

    // Cache count query separately (1 hour TTL, invalidated with posts)
    const totalCategories = await cache.getOrSetCount(
      countCacheKey,
      async () => {
        const [result] = await db
          .select({ value: count() })
          .from(categoryTable)
          .where(eq(categoryTable.workspaceId, workspaceId));

        return result?.value ?? 0;
      }
    );

    // Generate cache key for data (includes page)
    const listCacheKey = cacheKey(
      workspaceId,
      "categories",
      "list",
      hashQueryParams({ page, limit })
    );

    const totalPages = Math.ceil(totalCategories / limit);
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;
    const categoriesToSkip = limit ? (page - 1) * limit : 0;

    // Validate page number
    if (page > totalPages && totalCategories > 0) {
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

    const categoriesList = await cache.getOrSet(listCacheKey, async () =>
      db
        .select({
          id: categoryTable.id,
          name: categoryTable.name,
          slug: categoryTable.slug,
          description: categoryTable.description,
          postsCount: sql<number>`cast(count(${post.id}) as int)`,
        })
        .from(categoryTable)
        .leftJoin(
          post,
          and(
            eq(post.categoryId, categoryTable.id),
            eq(post.status, "published")
          )
        )
        .where(eq(categoryTable.workspaceId, workspaceId))
        .groupBy(categoryTable.id)
        .orderBy(asc(categoryTable.name), asc(categoryTable.id))
        .limit(limit)
        .offset(categoriesToSkip)
    );

    const transformedCategories = categoriesList.map(
      ({ postsCount, ...rest }) => ({
        ...rest,
        count: {
          posts: postsCount,
        },
      })
    );

    return c.json(
      {
        categories: transformedCategories,
        pagination: {
          limit,
          currentPage: page,
          nextPage,
          previousPage: prevPage,
          totalPages,
          totalItems: totalCategories,
        },
      },
      200 as const
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500 as const);
  }
});

categories.openapi(getCategoryRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const { identifier } = c.req.valid("param");
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    // Cache by identifier (slug or id)
    const singleCacheKey = cacheKey(workspaceId, "categories", identifier);

    const categoryRows = await cache.getOrSet(singleCacheKey, async () =>
      db
        .select({
          id: categoryTable.id,
          name: categoryTable.name,
          slug: categoryTable.slug,
          description: categoryTable.description,
          postsCount: sql<number>`cast(count(${post.id}) as int)`,
        })
        .from(categoryTable)
        .leftJoin(
          post,
          and(
            eq(post.categoryId, categoryTable.id),
            eq(post.status, "published")
          )
        )
        .where(
          and(
            eq(categoryTable.workspaceId, workspaceId),
            or(
              eq(categoryTable.id, identifier),
              eq(categoryTable.slug, identifier)
            )
          )
        )
        .groupBy(categoryTable.id)
        .limit(1)
    );

    const category = categoryRows[0];

    if (!category) {
      return c.json(
        {
          error: "Category not found",
          message: "The requested category does not exist",
        },
        404 as const
      );
    }

    const { postsCount, ...rest } = category;
    const transformedCategory = {
      ...rest,
      count: {
        posts: postsCount,
      },
    };

    return c.json({ category: transformedCategory }, 200 as const);
  } catch (error) {
    console.error("Error fetching category:", error);
    return c.json({ error: "Failed to fetch category" }, 500 as const);
  }
});

categories.openapi(createCategoryRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    // Check for slug uniqueness within workspace
    const existingCategory = await db.query.category.findFirst({
      where: and(
        eq(categoryTable.slug, body.slug),
        eq(categoryTable.workspaceId, workspaceId)
      ),
    });

    if (existingCategory) {
      return c.json(
        {
          error: "Slug already in use",
          message: "A category with this slug already exists in this workspace",
        },
        409 as const
      );
    }

    const [categoryCreated] = await db
      .insert(categoryTable)
      .values({
        id: createRecordId(),
        name: body.name,
        slug: body.slug,
        description: body.description ?? null,
        workspaceId,
        updatedAt: new Date(),
      })
      .returning({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        description: categoryTable.description,
      });

    if (!categoryCreated) {
      return c.json(
        {
          error: "Failed to create category",
          message: "An unexpected error occurred",
        },
        500 as const
      );
    }

    // Invalidate cache for categories and posts
    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "category_created",
        workspaceId,
        resourceType: "category",
        resourceId: categoryCreated.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: toCategoryPayload(categoryCreated),
      }).catch((error) => {
        console.error(
          "[categories.create] Failed to emit category_created:",
          error
        );
      })
    );

    return c.json({ category: categoryCreated }, 201 as const);
  } catch (error) {
    console.error("Error creating category:", error);
    return c.json(
      {
        error: "Failed to create category",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

const updateCategoryRoute = createRoute({
  method: "patch",
  path: "/{identifier}",
  tags: ["Categories"],
  summary: "Update category",
  description:
    "Update an existing category by ID or slug. Requires a private API key.",
  request: {
    params: CategoryParamsSchema,
    body: {
      content: { "application/json": { schema: UpdateCategoryBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: CreateCategoryResponseSchema },
      },
      description: "Category updated successfully",
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
      description: "Category not found",
    },
    409: {
      content: { "application/json": { schema: ConflictSchema } },
      description: "Category with this slug already exists",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

const deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/{identifier}",
  tags: ["Categories"],
  summary: "Delete category",
  description:
    "Delete a category by ID or slug. Requires a private API key. Cannot delete a category that has posts assigned to it.",
  request: {
    params: CategoryParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: DeleteResponseSchema } },
      description: "Category deleted successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Category has posts assigned to it",
    },
    403: {
      content: { "application/json": { schema: ForbiddenSchema } },
      description: "Public API key used for write operation",
    },
    404: {
      content: { "application/json": { schema: NotFoundSchema } },
      description: "Category not found",
    },
    500: {
      content: { "application/json": { schema: ServerErrorSchema } },
      description: "Server error",
    },
  },
});

categories.openapi(updateCategoryRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    const existingCategory = await db.query.category.findFirst({
      where: and(
        eq(categoryTable.workspaceId, workspaceId),
        or(eq(categoryTable.id, identifier), eq(categoryTable.slug, identifier))
      ),
    });

    if (!existingCategory) {
      return c.json(
        {
          error: "Category not found",
          message: "The requested category does not exist",
        },
        404 as const
      );
    }

    // If slug is being changed, check uniqueness
    if (body.slug && body.slug !== existingCategory.slug) {
      const slugConflict = await db.query.category.findFirst({
        where: and(
          eq(categoryTable.slug, body.slug),
          eq(categoryTable.workspaceId, workspaceId),
          ne(categoryTable.id, existingCategory.id)
        ),
      });

      if (slugConflict) {
        return c.json(
          {
            error: "Slug already in use",
            message:
              "A category with this slug already exists in this workspace",
          },
          409 as const
        );
      }
    }

    const [categoryUpdated] = await db
      .update(categoryTable)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        updatedAt: new Date(),
      })
      .where(eq(categoryTable.id, existingCategory.id))
      .returning({
        id: categoryTable.id,
        name: categoryTable.name,
        slug: categoryTable.slug,
        description: categoryTable.description,
      });

    if (!categoryUpdated) {
      return c.json(
        {
          error: "Failed to update category",
          message: "An unexpected error occurred",
        },
        500 as const
      );
    }

    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "category_updated",
        workspaceId,
        resourceType: "category",
        resourceId: categoryUpdated.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: withChanges(
          toCategoryPayload(categoryUpdated),
          Object.keys(body)
        ),
      }).catch((error) => {
        console.error(
          "[categories.update] Failed to emit category_updated:",
          error
        );
      })
    );

    return c.json({ category: categoryUpdated }, 200 as const);
  } catch (error) {
    console.error("Error updating category:", error);
    return c.json(
      {
        error: "Failed to update category",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

categories.openapi(deleteCategoryRoute, async (c) => {
  try {
    const workspaceId = requireWorkspaceId(c);
    const db = c.get("db");
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingCategory = await db.query.category.findFirst({
      where: and(
        eq(categoryTable.workspaceId, workspaceId),
        or(eq(categoryTable.id, identifier), eq(categoryTable.slug, identifier))
      ),
    });

    if (!existingCategory) {
      return c.json(
        {
          error: "Category not found",
          message: "The requested category does not exist",
        },
        404 as const
      );
    }

    const [postsCountResult] = await db
      .select({ value: count() })
      .from(post)
      .where(
        and(
          eq(post.categoryId, existingCategory.id),
          eq(post.workspaceId, workspaceId)
        )
      );

    const postsCount = postsCountResult?.value ?? 0;

    // Prevent deleting a category that has posts
    if (postsCount > 0) {
      return c.json(
        {
          error: "Category has posts",
          message: `This category has ${postsCount} post(s) assigned to it. Reassign or delete them before deleting this category.`,
        },
        400 as const
      );
    }

    await db
      .delete(categoryTable)
      .where(eq(categoryTable.id, existingCategory.id));

    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

    const apiKeyId = c.get("apiKeyId");
    c.executionCtx.waitUntil(
      emitEvent(db, c.env.EVENT_QUEUE, {
        type: "category_deleted",
        workspaceId,
        resourceType: "category",
        resourceId: existingCategory.id,
        actorType: "api_key",
        actorId: apiKeyId,
        payload: toCategoryPayload(existingCategory),
      }).catch((error) => {
        console.error(
          "[categories.delete] Failed to emit category_deleted:",
          error
        );
      })
    );

    return c.json({ id: existingCategory.id }, 200 as const);
  } catch (error) {
    console.error("Error deleting category:", error);
    return c.json(
      {
        error: "Failed to delete category",
        message: "An unexpected error occurred",
      },
      500 as const
    );
  }
});

export default categories;
