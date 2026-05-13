import type {
  EventPayload,
  WorkspaceEventActorType,
  WorkspaceEventResourceType,
  WorkspaceEventType,
} from "@marble/events";

interface EmitDashboardEventArgs {
  type: WorkspaceEventType;
  workspaceId: string;
  resourceType: WorkspaceEventResourceType;
  resourceId: string;
  actorType?: WorkspaceEventActorType;
  actorId?: string;
  payload?: EventPayload;
}

export function emitDashboardEvent({
  type,
  workspaceId,
  resourceType,
  resourceId,
  actorType = "user",
  actorId,
  payload = {},
}: EmitDashboardEventArgs) {
  const apiUrl = process.env.MARBLE_API_URL;
  const systemSecret = process.env.SYSTEM_SECRET;

  if (!apiUrl || !systemSecret) {
    console.warn(
      "[DashboardEvents] Missing MARBLE_API_URL or SYSTEM_SECRET, skipping event emission"
    );
    return;
  }

  fetch(`${apiUrl}/internal/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-System-Secret": systemSecret,
    },
    body: JSON.stringify({
      type,
      workspaceId,
      source: "dashboard",
      resourceType,
      resourceId,
      actorType,
      ...(actorId && { actorId }),
      payload,
    }),
  }).catch((error) => {
    console.error(`[DashboardEvents] Failed to emit ${type}:`, error);
  });
}
