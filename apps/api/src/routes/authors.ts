import { createClient } from "@marble/db";
import { Hono } from "hono";
import type { Env } from "../types/env";
import { AuthorQuerySchema, AuthorsQuerySchema } from "../validations/authors";

const authors = new Hono<{ Bindings: Env }>();

authors.get("/", async (c) => {
  const url = c.env.DATABASE_URL;
  const workspaceId = c.req.param("workspaceId");
  const db = createClient(url);

  // Validate query parameters
  const queryValidation = AuthorsQuerySchema.safeParse({
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

  const totalAuthors = await db.author.count({
    where: {
      workspaceId,
      coAuthoredPosts: {
        some: {
          status: "published",
        },
      },
    },
  });

  const totalPages = Math.ceil(totalAuthors / limit);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const authorsToSkip = limit ? (page - 1) * limit : 0;

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
      400
    );
  }

  try {
    const authorsList = await db.author.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        image: true,
        slug: true,
        bio: true,
        role: true,
        socials: {
          select: {
            url: true,
            platform: true,
          },
        },
        _count: {
          select: {
            coAuthoredPosts: {
              where: {
                status: "published",
              },
            },
          },
        },
      },
      orderBy: [{ name: "asc" }],
      take: limit,
      skip: authorsToSkip,
    });

    // because I dont want prisma's ugly _count
    const transformedAuthors = authorsList.map((author) => ({
      ...author,
      count: {
        posts: author._count.coAuthoredPosts,
      },
      _count: undefined,
    }));

    return c.json({
      authors: transformedAuthors,
      pagination: {
        limit,
        currentPage: page,
        nextPage,
        previousPage: prevPage,
        totalPages,
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

  const queryValidation = AuthorQuerySchema.safeParse({
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

  try {
    const author = await db.author.findFirst({
      where: {
        workspaceId,
        isActive: true,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: {
        id: true,
        name: true,
        image: true,
        slug: true,
        bio: true,
        role: true,
        socials: {
          select: {
            url: true,
            platform: true,
          },
        },
      },
    });

    if (!author) {
      return c.json({ error: "Author not found" }, 404);
    }

    const totalPosts = await db.post.count({
      where: {
        workspaceId,
        status: "published",
        authors: {
          some: {
            id: author.id,
          },
        },
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

    if (include.includes("posts")) {
      const posts = await db.post.findMany({
        where: {
          workspaceId,
          status: "published",
          authors: {
            some: {
              id: author.id,
            },
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          publishedAt: true,
        },
        orderBy: {
          publishedAt: "desc",
        },
        take: limit,
        skip: postsToSkip,
      });

      return c.json({
        ...author,
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

    return c.json({ author });
  } catch (_error) {
    return c.json({ error: "Failed to fetch author" }, 500);
  }
});

export default authors;
