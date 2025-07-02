import { createClient } from "@marble/db";
import { Hono } from "hono";
import { ratelimit } from "./middleware";
import { BasicPaginationSchema, PostsQuerySchema } from "./validations";

export type Env = {
  DATABASE_URL: string;
  REDIS_URL: string;
  REDIS_TOKEN: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", ratelimit());

app.get("/", (c) => {
  return c.text("Hello from marble");
});

app.get("/status", (c) => {
  return c.json({ status: "ok" }, 200);
});

app.get("/:workspaceId/tags", async (c) => {
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
    const totalTags = await db.tag.count({ where: { workspaceId } });

    const totalPages = Math.ceil(totalTags / limit);
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    // Validate page number
    if (page > totalPages && totalTags > 0) {
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

    const tags = await db.tag.findMany({
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
      tags,
      pagination: {
        limit,
        currPage: page,
        nextPage,
        prevPage,
        totalPages,
        totalItems: totalTags,
      },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return c.json({ error: "Failed to fetch tags" }, 500);
  }
});

app.get("/:workspaceId/categories", async (c) => {
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
        currPage: page,
        nextPage,
        prevPage,
        totalPages,
        totalItems: totalCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

app.get("/:workspaceId/posts", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = c.req.param("workspaceId");
    const db = createClient(url);

    // Validate query parameters
    const queryValidation = PostsQuerySchema.safeParse({
      limit: c.req.query("limit"),
      page: c.req.query("page"),
      order: c.req.query("order"),
      category: c.req.query("category"),
      tags: c.req.query("tags"),
      query: c.req.query("query"),
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
        400,
      );
    }

    const {
      limit: rawLimit,
      page,
      order,
      category,
      tags = [],
      query,
    } = queryValidation.data;

    // Build the where clause
    const where = {
      workspaceId,
      status: "published" as const,
      ...(category && { category: { slug: category } }),
      ...(tags.length > 0 && {
        tags: {
          some: {
            slug: {
              in: tags,
            },
          },
        },
      }),
      ...(query && {
        OR: [{ title: { contains: query } }, { content: { contains: query } }],
      }),
    };

    // Get total count for pagination
    const totalPosts = await db.post.count({ where });

    // Handle pagination
    const limit = rawLimit === "all" ? undefined : rawLimit;
    const totalPages = limit ? Math.ceil(totalPosts / limit) : 1;

    // Validate page number if pagination is enabled
    if (limit && page > totalPages && totalPosts > 0) {
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

    // Infer some additional stuff
    const postsToSkip = limit ? (page - 1) * limit : 0;
    const prevPage = page > 1 ? page - 1 : null;
    const nextPage = page < totalPages ? page + 1 : null;

    const posts = await db.post.findMany({
      where,
      orderBy: {
        publishedAt: order,
      },
      take: limit,
      skip: postsToSkip,
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        coverImage: true,
        description: true,
        publishedAt: true,
        updatedAt: true,
        attribution: true,
        authors: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const paginationInfo = limit
      ? {
          limit,
          currPage: page,
          nextPage: nextPage,
          prevPage: prevPage,
          totalPages: totalPages,
          totalItems: totalPosts,
        }
      : {
          limit: totalPosts,
          currPage: 1,
          nextPage: null,
          prevPage: null,
          totalPages: 1,
          totalItems: totalPosts,
        };

    return c.json({
      posts: posts,
      pagination: paginationInfo,
      // meta: {
      //   filters: {
      //     category: category || undefined,
      //     tags: tags.length > 0 ? tags : undefined,
      //     query: query || undefined,
      //     order,
      //   },
      // },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json(
      {
        error: "Failed to fetch posts",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});

app.get("/:workspaceId/posts/:slug", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = c.req.param("workspaceId");
    const slug = c.req.param("slug");
    const db = createClient(url);

    const post = await db.post.findFirst({
      where: {
        workspaceId,
        slug,
        status: "published",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        coverImage: true,
        description: true,
        publishedAt: true,
        updatedAt: true,
        attribution: true,
        authors: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    return c.json({ post });
  } catch (_error) {
    return c.json({ error: "Failed to fetch post" }, 500);
  }
});

app.get("/:workspaceId/authors", async (c) => {
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
    const authors = await db.user.findMany({
      where: {
        members: {
          some: { organizationId: workspaceId },
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalAuthors = await db.user.count({
      where: {
        members: {
          some: { organizationId: workspaceId },
        },
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
        currPage: page,
        nextPage: nextPage,
        prevPage: prevPage,
        totalPages: totalPages,
        totalItems: totalAuthors,
      },
    });
  } catch (_error) {
    return c.json({ error: "Failed to fetch authors" }, 500);
  }
});

app.get("/:workspaceId/authors/:id", async (c) => {
  const url = c.env.DATABASE_URL;
  const workspaceId = c.req.param("workspaceId");
  const authorId = c.req.param("id");
  const db = createClient(url);

  try {
    const author = await db.user.findUnique({
      where: {
        id: authorId,
        members: {
          some: { organizationId: workspaceId },
        },
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

export default app;
