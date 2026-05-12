import type { createDbClient } from "@/lib/db";
import type { JsonObject } from "@/validations/json";
import type {
  WORKSPACE_EVENT_ACTOR_TYPES,
  WORKSPACE_EVENT_RESOURCE_TYPES,
  WORKSPACE_EVENT_SOURCES,
  WORKSPACE_EVENT_TYPES,
} from "@/validations/misc";

interface EmitEventOptions {
  type: (typeof WORKSPACE_EVENT_TYPES)[number];
  workspaceId: string;
  resourceType: (typeof WORKSPACE_EVENT_RESOURCE_TYPES)[number];
  resourceId: string;
  source?: (typeof WORKSPACE_EVENT_SOURCES)[number];
  actorType?: (typeof WORKSPACE_EVENT_ACTOR_TYPES)[number];
  actorId?: string;
  payload?: JsonObject;
}

export async function emitEvent(
  db: ReturnType<typeof createDbClient>,
  queue: Queue,
  options: EmitEventOptions
) {
  const event = await db.workspaceEvent.create({
    data: {
      type: options.type,
      workspaceId: options.workspaceId,
      source: options.source ?? "api",
      resourceType: options.resourceType,
      resourceId: options.resourceId,
      actorType: options.actorType,
      actorId: options.actorId,
      payload: options.payload ?? {},
    },
  });

  await queue.send({ eventId: event.id });

  return event;
}
