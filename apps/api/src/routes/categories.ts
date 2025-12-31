import { createClient } from "@marble/db/workers";
import { Hono } from "hono";
import { cacheKey, createCacheClient, hashQueryParams } from "../lib/cache";
import { requireWorkspaceId } from "../lib/workspace";
import type { Env } from "../types/env";
import {
  CategoriesQuerySchema,
  CategoryQuerySchema,
} from "../validations/categories";

const categories = new Hono<{ Bindings: Env }>();

categories.get("/", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const db = createClient(url);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    const queryValidation = CategoriesQuerySchema.safeParse({
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

    return c.json({
      categories: transformedCategories,
      pagination: {
        limit,
        currentPage: page,
        nextPage,
        previousPage: prevPage,
        totalPages,
        totalItems: totalCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

categories.get("/:identifier", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = requireWorkspaceId(c);
    const identifier = c.req.param("identifier");
    const db = createClient(url);
    const cache = createCacheClient(c.env.REDIS_URL, c.env.REDIS_TOKEN);

    const queryValidation = CategoryQuerySchema.safeParse({
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
        404
      );
    }

    // Transform _count to count
    const { _count, ...rest } = category;
    const transformedCategory = {
      ...rest,
      count: _count,
    };

    return c.json(transformedCategory);
  } catch (error) {
    console.error("Error fetching category:", error);
    return c.json({ error: "Failed to fetch category" }, 500);
  }
});

export default categories;
