import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { createDbClient } from "../lib/db";
import { requireWorkspaceId } from "../lib/workspace";
import {
  CategoriesListResponseSchema,
  CategoryResponseSchema,
  CreateCategoryBodySchema,
  CreateCategoryResponseSchema,
  UpdateCategoryBodySchema,
} from "../schemas/categories";
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

const categories = new OpenAPIHono<{ Bindings: Env }>();

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
    const db = createDbClient(c.env);
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
    const totalCategories = await cache.getOrSetCount(countCacheKey, () =>
      db.category.count({
        where: { workspaceId },
      })
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

    const categoriesList = await cache.getOrSet(listCacheKey, () =>
      db.category.findMany({
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
        skip: categoriesToSkip,
      })
    );

    const transformedCategories = categoriesList.map((category) => {
      const { _count, ...rest } = category;
      return {
        ...rest,
        count: _count,
      };
    });

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
    const db = createDbClient(c.env);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    // Cache by identifier (slug or id)
    const singleCacheKey = cacheKey(workspaceId, "categories", identifier);

    const category = await cache.getOrSet(singleCacheKey, () =>
      db.category.findFirst({
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

    if (!category) {
      return c.json(
        {
          error: "Category not found",
          message: "The requested category does not exist",
        },
        404 as const
      );
    }

    // Transform _count to count
    const { _count, ...rest } = category;
    const transformedCategory = {
      ...rest,
      count: _count,
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
    const db = createDbClient(c.env);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const body = c.req.valid("json");

    // Check for slug uniqueness within workspace
    const existingCategory = await db.category.findFirst({
      where: {
        slug: body.slug,
        workspaceId,
      },
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

    const categoryCreated = await db.category.create({
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

    // Invalidate cache for categories and posts
    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

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
    const db = createDbClient(c.env);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");
    const body = c.req.valid("json");

    const existingCategory = await db.category.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { slug: identifier }],
      },
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
      const slugConflict = await db.category.findFirst({
        where: {
          slug: body.slug,
          workspaceId,
          id: { not: existingCategory.id },
        },
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

    const categoryUpdated = await db.category.update({
      where: { id: existingCategory.id },
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

    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

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
    const db = createDbClient(c.env);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);
    const { identifier } = c.req.valid("param");

    const existingCategory = await db.category.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        _count: { select: { posts: true } },
      },
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

    // Prevent deleting a category that has posts
    if (existingCategory._count.posts > 0) {
      return c.json(
        {
          error: "Category has posts",
          message: `This category has ${existingCategory._count.posts} post(s) assigned to it. Reassign or delete them before deleting this category.`,
        },
        400 as const
      );
    }

    await db.category.delete({
      where: { id: existingCategory.id },
    });

    c.executionCtx.waitUntil(
      cache.invalidateResource(workspaceId, "categories")
    );
    c.executionCtx.waitUntil(cache.invalidateResource(workspaceId, "posts"));

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
