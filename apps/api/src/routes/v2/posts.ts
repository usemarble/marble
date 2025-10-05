import { createClient } from "@marble/db";
import { Hono } from "hono";
import { NodeHtmlMarkdown } from "node-html-markdown";
import type { Env } from "../../types/env";
import { PostQuerySchema, PostsQuerySchema } from "../../validations/posts";

const posts = new Hono<{ Bindings: Env }>();

posts.get("/", async (c) => {
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
      exclude: c.req.query("exclude"),
      tags: c.req.query("tags"),
      query: c.req.query("query"),
      author: c.req.query("author"),
      featured: c.req.query("featured"),
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

    const {
      limit,
      page,
      order,
      author,
      category,
      include = [],
      exclude = [],
      tags = [],
      query,
      featured,
    } = queryValidation.data;

    // Build the where clause
    const where = {
      workspaceId,
      status: "published" as const,
      ...(() => {
        if (category) {
          return { category: { slug: category } };
        }
        if (exclude.length > 0) {
          return { category: { slug: { notIn: exclude } } };
        }
        if (author) {
          return { authors: { some: { slug: author } } };
        }
        return {};
      })(),
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
      ...(featured !== undefined && { featured }),
    };

    // Get total count for pagination
    const totalPosts = await db.post.count({ where });

    // Handle pagination
    const totalPages = Math.ceil(totalPosts / limit);

    // Validate page number
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

    // Infer some additional stuff
    const postsToSkip = (page - 1) * limit;
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
        featured: true,
        ...(include.includes("authors") && {
          authors: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
              role: true,
              slug: true,
              socials: {
                select: {
                  url: true,
                  platform: true,
                },
              },
            },
          },
        }),
        ...(include.includes("category") && {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        }),
        ...(include.includes("tags") && {
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        }),
      },
    });

    // Format posts based on requested format
    const formattedPosts =
      format === "markdown"
        ? posts.map((post) => ({
            ...post,
            content: NodeHtmlMarkdown.translate(post.content || ""),
          }))
        : posts;

    const paginationInfo = {
      limit,
      currentPage: page,
      nextPage,
      previousPage: prevPage,
      totalPages,
      totalItems: totalPosts,
    };

    return c.json({
      posts: formattedPosts,
      pagination: paginationInfo,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json(
      {
        error: "Failed to fetch posts",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

posts.get("/:identifier", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = c.req.param("workspaceId");
    const identifier = c.req.param("identifier");
    const format = c.req.query("format");
    const db = createClient(url);

    // Validate query parameters
    const queryValidation = PostQuerySchema.safeParse({
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

    const { include = [] } = queryValidation.data;

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
        featured: true,
        ...(include.includes("authors") && {
          authors: {
            select: {
              id: true,
              name: true,
              image: true,
              bio: true,
              role: true,
              slug: true,
              socials: {
                select: {
                  url: true,
                  platform: true,
                },
              },
            },
          },
        }),
        ...(include.includes("category") && {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        }),
        ...(include.includes("tags") && {
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        }),
      },
    });

    if (!post) {
      return c.json({ error: "Post not found" }, 404);
    }

    // Format post based on requested format
    const formattedPost =
      format === "markdown"
        ? { ...post, content: NodeHtmlMarkdown.translate(post.content || "") }
        : post;

    return c.json(formattedPost);
  } catch (_error) {
    return c.json({ error: "Failed to fetch post" }, 500);
  }
});

export default posts;
