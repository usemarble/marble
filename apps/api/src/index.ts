import { createClient } from "@marble/db";
import { Hono } from "hono";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { ratelimit } from "./middleware";
import { BasicPaginationSchema, PostsQuerySchema } from "./validations";

export type Env = {
  DATABASE_URL: string;
  REDIS_URL: string;
  REDIS_TOKEN: string;
};

const app = new Hono<{ Bindings: Env }>();
const v1 = new Hono<{ Bindings: Env }>();

app.use("*", ratelimit());

app.use("*", async (c, next) => {
  await next();
  const cacheControl = c.res.headers.get("Cache-Control");
  c.header(
    "Cache-Control",
    cacheControl
      ? `${cacheControl}, stale-if-error=3600`
      : "stale-if-error=3600",
  );
});

app.use("/:workspaceId/*", async (c, next) => {
  const path = c.req.path;
  const workspaceId = c.req.param("workspaceId");

  if (path.startsWith("/v1/") || path === "/" || path === "/status") {
    return next();
  }

  const workspaceRoutes = ["/tags", "/categories", "/posts", "/authors"];
  const workspacePathPattern = `/${workspaceId}`;

  const isWorkspaceRoute = workspaceRoutes.some((route) => {
    const exactMatch = path === `${workspacePathPattern}${route}`;
    const subPathMatch = path.startsWith(`${workspacePathPattern}${route}/`);
    return exactMatch || subPathMatch;
  });

  if (isWorkspaceRoute) {
    const newPath = `/v1${path}`;
    const url = new URL(c.req.url);
    url.pathname = newPath;
    return Response.redirect(url.toString(), 301);
  }

  return next();
});

app.get("/", (c) => {
  return c.text("Hello from marble");
});

app.get("/status", (c) => {
  return c.json({ status: "ok" }, 200);
});

v1.get("/:workspaceId/tags", async (c) => {
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
        currentPage: page,
        nextPage,
        previousPage: prevPage,
        totalPages,
        totalItems: totalTags,
      },
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return c.json({ error: "Failed to fetch tags" }, 500);
  }
});

v1.get("/:workspaceId/categories", async (c) => {
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

v1.get("/:workspaceId/posts", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = c.req.param("workspaceId");
    const format = c.req.query("format");
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

    // Check if a format query was provided
    // Convert html -> markdown
    const formattedPosts =
      format === "markdown"
        ? posts.map((post) => ({
            ...post,
            content: NodeHtmlMarkdown.translate(post.content || ""),
          }))
        : posts;

    const paginationInfo = limit
      ? {
          limit,
          currentPage: page,
          nextPage: nextPage,
          previousPage: prevPage,
          totalPages: totalPages,
          totalItems: totalPosts,
        }
      : {
          limit: totalPosts,
          currentPage: 1,
          nextPage: null,
          previousPage: null,
          totalPages: 1,
          totalItems: totalPosts,
        };

    return c.json({
      posts: formattedPosts,
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

v1.get("/:workspaceId/posts/:identifier", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = c.req.param("workspaceId");
    const identifier = c.req.param("identifier");
    const format = c.req.query("format");
    const db = createClient(url);

    const post = await db.post.findFirst({
      where: {
        workspaceId,
        OR: [{ slug: identifier }, { id: identifier }],
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

    // Check if format needs to be markdown
    // Convert to html -> markdown
    // If not provided go with the html
    const formattedPost =
      format === "markdown"
        ? { ...post, content: NodeHtmlMarkdown.translate(post.content || "") }
        : post;

    return c.json({ post: formattedPost });
  } catch (_error) {
    return c.json({ error: "Failed to fetch post" }, 500);
  }
});

v1.get("/:workspaceId/authors", async (c) => {
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

v1.get("/:workspaceId/authors/:id", async (c) => {
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

app.route("/v1", v1);

export default app;
