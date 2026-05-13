import type { WorkspaceEventLike } from "../types";
import { serializeEventType } from "./events";

/** Builds the stable JSON body sent to normal webhook endpoints. */
export function buildWebhookPayload(event: WorkspaceEventLike) {
  const createdAt =
    event.createdAt instanceof Date
      ? event.createdAt.toISOString()
      : event.createdAt;

  return {
    id: event.id,
    type: serializeEventType(event.type),
    createdAt,
    workspaceId: event.workspaceId,
    resource:
      event.resourceType && event.resourceId
        ? {
            type: event.resourceType,
            id: event.resourceId,
          }
        : null,
    actor: event.actorType
      ? {
          type: event.actorType,
          id: event.actorId ?? null,
        }
      : null,
    data:
      event.payload &&
      typeof event.payload === "object" &&
      !Array.isArray(event.payload)
        ? event.payload
        : {},
  };
}
