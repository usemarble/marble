import { createClient } from "@marble/db";
import { Hono } from "hono";
import type { Env } from "../types/env";
import { BasicPaginationSchema } from "../validations";

const categories = new Hono<{ Bindings: Env }>();

categories.get("/", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = c.req.param("workspaceId");
    const db = createClient(url);

    // Validate pagination params
    const queryValidation = BasicPaginationSchema.safeParse({
      limit: c.req.query("limit"),
      page: c.req.query("page"),
    });

    if (!queryValidation.success) {
      return c.json(
        {
          error: "Invalid pagination parameters",
          details: queryValidation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        400,
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
        400,
      );
    }

    const categories = await db.category.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    return c.json({
      categories,
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

export default categories;
