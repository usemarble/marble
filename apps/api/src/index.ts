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

app.get("/tags/:id", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const id = c.req.param("id");
    const db = createClient(url);

    const tags = await db.tag.findMany({
      where: {
        workspaceId: id,
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

app.get("/categories/:id", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const id = c.req.param("id");
    const db = createClient(url);

    const tags = await db.category.findMany({
      where: {
        workspaceId: id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    return c.json(tags);
  } catch (error) {
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

app.get("/posts/:id", async (c) => {
  try {
    const url = c.env.DATABASE_URL;
    const id = c.req.param("id");
    const db = createClient(url);

    const posts = await db.post.findMany({
      where: {
        workspaceId: id,
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
        author: {
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
    return c.json(posts);
  } catch (error) {
    return c.json({ error: "Failed to fetch posts" }, 500);
  }
});

export default app;
