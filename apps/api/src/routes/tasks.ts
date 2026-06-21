import { Hono } from "hono";
import type { Env } from "@/types/env";
import { taskSchema } from "@/validations/misc";

const tasks = new Hono<{ Bindings: Env }>();

tasks.post("/", async (c) => {
  let rawBody: unknown;

  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const validation = taskSchema.safeParse(rawBody);

  if (!validation.success) {
    return c.json(
      {
        error: "Invalid task payload",
        details: validation.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
      400
    );
  }

  await c.env.TASK_QUEUE.send(validation.data);

  return c.json({ ok: true });
});

export default tasks;
