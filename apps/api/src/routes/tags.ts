import { createClient } from "@marble/db";
import { Hono } from "hono";
import type { Env } from "../env";
import { BasicPaginationSchema } from "../validations";

const tags = new Hono<{ Bindings: Env }>();

tags.get("/", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  const workspaceId = c.req.param("workspaceId");

  const queryValidation = BasicPaginationSchema.safeParse({
    limit: c.req.query("limit"),
    page: c.req.query("page"),
  });

  if (!queryValidation.success) {
    return c.json({ error: "Invalid pagination parameters" }, 400);
  }

  const { limit, page } = queryValidation.data;
  const totalTags = await db.tag.count({ where: { workspaceId } });
  const tags = await db.tag.findMany({
    where: { workspaceId },
    select: { id: true, name: true, slug: true },
    take: limit,
    skip: (page - 1) * limit,
  });

  return c.json({
    tags,
    pagination: {
      limit,
      currentPage: page,
      totalPages: Math.ceil(totalTags / limit),
      totalItems: totalTags,
    },
  });
});

export default tags;
