import { createClient } from "@marble/db";
import { Hono } from "hono";
import type { Env } from "../types/env";
import { BasicPaginationSchema } from "../validations";

const authors = new Hono<{ Bindings: Env }>();

authors.get("/", async (c) => {
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

  try {
    const authors = await db.author.findMany({
      where: {
        workspaceId: workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        slug: true,
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalAuthors = await db.author.count({
      where: {
        workspaceId: workspaceId,
        isActive: true,
      },
    });

    const totalPages = Math.ceil(totalAuthors / limit);
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    if (page > totalPages && totalAuthors > 0) {
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

    return c.json({
      authors,
      pagination: {
        limit,
        currentPage: page,
        nextPage: nextPage,
        previousPage: prevPage,
        totalPages: totalPages,
        totalItems: totalAuthors,
      },
    });
  } catch (_error) {
    return c.json({ error: "Failed to fetch authors" }, 500);
  }
});

authors.get("/:identifier", async (c) => {
  const url = c.env.DATABASE_URL;
  const workspaceId = c.req.param("workspaceId");
  const identifier = c.req.param("identifier");
  const db = createClient(url);

  try {
    const author = await db.author.findFirst({
      where: {
        workspaceId: workspaceId,
        isActive: true,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    if (!author) {
      return c.json({ error: "Author not found" }, 404);
    }

    return c.json(author);
  } catch (_error) {
    return c.json({ error: "Failed to fetch author" }, 500);
  }
});

export default authors;
