import { createClient } from "@marble/db";
import { Hono } from "hono";
import type { Env } from "../../types/env";
import { TagQuerySchema, TagsQuerySchema } from "../../validations/tags";

const tags = new Hono<{ Bindings: Env }>();

tags.get("/", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  const workspaceId = c.req.param("workspaceId");

  const queryValidation = TagsQuerySchema.safeParse({
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
  const totalTags = await db.tag.count({
    where: {
      workspaceId,
      posts: {
        some: {
          status: "published",
        },
      },
    },
  });

  const totalPages = Math.ceil(totalTags / limit);
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const tagsToSkip = limit ? (page - 1) * limit : 0;

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
      400
    );
  }

  const tagsList = await db.tag.findMany({
    where: {
      workspaceId,
      posts: {
        some: {
          status: "published",
        },
      },
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
    skip: tagsToSkip,
  });

  // because I dont want prisma's ugly _count
  const transformedTags = tagsList.map((tag) => {
    const { _count, ...rest } = tag;
    return {
      ...rest,
      count: _count,
    };
  });

  return c.json({
    tags: transformedTags,
    pagination: {
      limit,
      currentPage: page,
      nextPage,
      previousPage: prevPage,
      totalPages,
      totalItems: totalTags,
    },
  });
});

tags.get("/:identifier", async (c) => {
  try {
    const db = createClient(c.env.DATABASE_URL);
    const workspaceId = c.req.param("workspaceId");
    const identifier = c.req.param("identifier");

    const queryValidation = TagQuerySchema.safeParse({
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

    // First get the tag
    const tag = await db.tag.findFirst({
      where: {
        workspaceId,
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });

    if (!tag) {
      return c.json({ error: "Tag not found" }, 404);
    }
    const totalPosts = await db.post.count({
      where: {
        workspaceId,
        status: "published",
        tags: {
          some: {
            id: tag.id,
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
          tags: {
            some: {
              id: tag.id,
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
        ...tag,
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

    return c.json(tag);
  } catch (error) {
    console.error("Error fetching tag:", error);
    return c.json({ error: "Failed to fetch tag" }, 500);
  }
});

export default tags;
