import { createClient } from "@marble/db";
import { Hono } from "hono";
import { env } from "hono/adapter";
import type { Env } from "../types/env";
import {
  CategoriesQuerySchema,
  CategoryQuerySchema,
} from "../validations/categories";

const categories = new Hono<{ Bindings: Env }>();

categories.get("/", async (c) => {
  try {
    const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
    const workspaceId = c.req.param("workspaceId");
    const db = createClient(DATABASE_URL);

    const queryValidation = CategoriesQuerySchema.safeParse({
      limit: c.req.query("limit"),
      page: c.req.query("page"),
      include: c.req.query("include"),
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

    // Get total count
    const totalCategories = await db.category.count({
      where: { workspaceId },
    });

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

    const categoriesList = await db.category.findMany({
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
    });

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
    const { DATABASE_URL } = env<{ DATABASE_URL: string }>(c);
    const workspaceId = c.req.param("workspaceId");
    const identifier = c.req.param("identifier");
    const db = createClient(DATABASE_URL);

    const queryValidation = CategoryQuerySchema.safeParse({
      limit: c.req.query("limit"),
      page: c.req.query("page"),
      include: c.req.query("include"),
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

    const { limit, page, include = [] } = queryValidation.data;

    const category = await db.category.findFirst({
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
    });

    if (!category) {
      return c.json(
        {
          error: "Category not found",
          message: "The requested category does not exist",
        },
        404
      );
    }

    const totalPosts = await db.post.count({
      where: {
        workspaceId,
        status: "published",
        categoryId: category.id,
      },
    });

    const totalPages = Math.ceil(totalPosts / limit);
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;
    const postsToSkip = limit ? (page - 1) * limit : 0;

    if (page > totalPages && totalPosts > 0) {
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

    // Transform _count to count
    const { _count, ...rest } = category;
    const transformedCategory = {
      ...rest,
      count: _count,
    };

    if (include.includes("posts")) {
      const posts = await db.post.findMany({
        where: {
          workspaceId,
          status: "published",
          categoryId: category.id,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          publishedAt: true,
          updatedAt: true,
          content: true,
          authors: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: limit,
        skip: postsToSkip,
      });

      return c.json({
        ...transformedCategory,
        posts: {
          data: posts,
          pagination: {
            limit,
            currentPage: page,
            nextPage,
            previousPage: prevPage,
            totalPages,
            totalItems: totalPosts,
          },
        },
      });
    }

    return c.json(transformedCategory);
  } catch (error) {
    console.error("Error fetching category:", error);
    return c.json({ error: "Failed to fetch category" }, 500);
  }
});

export default categories;
