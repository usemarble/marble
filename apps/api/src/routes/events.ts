import { createRecordId } from "@marble/drizzle/id";
import { workspace, workspaceEvent } from "@marble/drizzle/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { DbClient } from "@/lib/db";
import type { Env } from "@/types/env";
import { InternalEventSchema } from "@/validations/misc";

const events = new Hono<{ Bindings: Env; Variables: { db: DbClient } }>();

events.post("/", async (c) => {
  let rawBody: unknown;

  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const validation = InternalEventSchema.safeParse(rawBody);

  if (!validation.success) {
    return c.json(
      {
        error: "Invalid event payload",
        details: validation.error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
      400
    );
  }

  const body = validation.data;

  const db = c.get("db");

  const foundWorkspace = await db.query.workspace.findFirst({
    where: eq(workspace.id, body.workspaceId),
    columns: { id: true },
  });

  if (!foundWorkspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  try {
    const [event] = await db
      .insert(workspaceEvent)
      .values({
        id: createRecordId(),
        type: body.type,
        workspaceId: body.workspaceId,
        source: body.source,
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        actorType: body.actorType,
        actorId: body.actorId,
        payload: body.payload ?? {},
      })
      .returning();

    await c.env.EVENT_QUEUE.send({
      type: "event.fanout",
      eventId: event.id,
      targetWebhookEndpointId: body.targetWebhookEndpointId,
      isTest: body.isTest,
    });

    return c.json({ ok: true, eventId: event.id });
  } catch (error) {
    console.error("[InternalEvents] Failed to create event:", error);
    return c.json(
      {
        error: "Failed to create event",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export default events;
