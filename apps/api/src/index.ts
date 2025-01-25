import { createClient } from "@repo/db";
import { Hono } from "hono";

export type Env = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

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

    const tags = await db.tag.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    return c.json(tags);
  } catch (error) {
    return c.json({ error: "Failed to fetch tags" }, 500);
  }
});

app.get("/:workspaceId/categories", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = c.req.param("workspaceId");
    const db = createClient(url);

    const categories = await db.category.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    return c.json(categories);
  } catch (error) {
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

app.get("/:workspaceId/posts", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const workspaceId = c.req.param("workspaceId");
    const db = createClient(url);
    console.log(workspaceId);

    const limit = Number(c.req.query("limit")) || 20;
    const page = Number(c.req.query("page")) || 1;
    const category = c.req.query("category");
    const tag = c.req.query("tag");

    const posts = await db.post.findMany({
      where: {
        workspaceId,
        status: "published",
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        content: true,
        coverImage: true,
        description: true,
        publishedAt: true,
        attribution: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: {
          select: {
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
    return c.json(posts);
  } catch (error) {
    return c.json({ error: "Failed to fetch posts" }, 500);
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
        attribution: true,
        author: {
          select: {
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

    return c.json(post);
  } catch (error) {
    return c.json({ error: "Failed to fetch post" }, 500);
  }
});

export default app;
