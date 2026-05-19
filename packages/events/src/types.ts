/** Workspace event names persisted internally and exposed as dotted webhook types. */
export const WORKSPACE_EVENT_TYPES = [
  "post_created",
  "post_published",
  "post_unpublished",
  "post_updated",
  "post_deleted",
  "category_created",
  "category_updated",
  "category_deleted",
  "tag_created",
  "tag_updated",
  "tag_deleted",
  "media_uploaded",
  "media_updated",
  "media_deleted",
  "author_created",
  "author_updated",
  "author_deleted",
] as const;

/** Origin systems that can create workspace events. */
export const WORKSPACE_EVENT_SOURCES = [
  "dashboard",
  "api",
  "mcp",
  "workflow",
  "system",
] as const;

/** Actor classes that can be attached to a workspace event. */
export const WORKSPACE_EVENT_ACTOR_TYPES = [
  "user",
  "api_key",
  "mcp",
  "system",
] as const;

/** Resource classes supported by workspace events and webhook envelopes. */
export const WORKSPACE_EVENT_RESOURCE_TYPES = [
  "post",
  "category",
  "tag",
  "media",
  "author",
  "workspace",
] as const;

export type WorkspaceEventType = (typeof WORKSPACE_EVENT_TYPES)[number];
export type WorkspaceEventSource = (typeof WORKSPACE_EVENT_SOURCES)[number];
export type WorkspaceEventActorType =
  (typeof WORKSPACE_EVENT_ACTOR_TYPES)[number];
export type WorkspaceEventResourceType =
  (typeof WORKSPACE_EVENT_RESOURCE_TYPES)[number];

export type EventPayloadValue =
  | string
  | number
  | boolean
  | null
  | EventPayload
  | EventPayloadArray;

export interface EventPayloadArray extends Array<EventPayloadValue> {}

/** JSON-compatible object used as the event-specific webhook data payload. */
export interface EventPayload {
  [key: string]: EventPayloadValue;
}

/** Minimal event shape required to build the public webhook envelope. */
export interface WorkspaceEventLike {
  id: string;
  type: WorkspaceEventType | string;
  createdAt: Date | string;
  workspaceId: string;
  resourceType?: WorkspaceEventResourceType | string | null;
  resourceId?: string | null;
  actorType?: WorkspaceEventActorType | string | null;
  actorId?: string | null;
  payload?: unknown;
}

export type Dateish = Date | string | null | undefined;
