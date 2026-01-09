import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@marble/db/workers";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { requireWorkspaceId } from "../lib/workspace";
import {
  CategoriesListResponseSchema,
  SingleCategoryResponseSchema,
} from "../schemas/categories";
import {
  ErrorSchema,
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
  summary: "Get a category",
  description: "Get a single category by ID or slug",
  request: {
    params: CategoryParamsSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: SingleCategoryResponseSchema } },
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


categories.openapi(listCategoriesRoute, async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const db = createClient(url);
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
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const { identifier } = c.req.valid("param");
    const db = createClient(url);
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

export default categories;
