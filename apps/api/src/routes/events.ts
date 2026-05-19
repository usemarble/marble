import { Hono } from "hono";
import { createDbClient } from "@/lib/db";
import type { Env } from "@/types/env";
import { InternalEventSchema } from "@/validations/misc";

const events = new Hono<{ Bindings: Env }>();

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

  const db = createDbClient(c.env);

  const workspace = await db.organization.findUnique({
    where: { id: body.workspaceId },
    select: { id: true },
  });

  if (!workspace) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  try {
    const event = await db.workspaceEvent.create({
      data: {
        type: body.type,
        workspaceId: body.workspaceId,
        source: body.source,
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        actorType: body.actorType,
        actorId: body.actorId,
        payload: body.payload ?? {},
      },
    });

    await c.env.EVENT_QUEUE.send({
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
