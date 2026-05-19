import type { WorkspaceEventResourceType, WorkspaceEventType } from "../types";

/** Converts persisted enum names like `post_published` into public webhook names like `post.published`. */
export function serializeEventType(type: string) {
  return type.replaceAll("_", ".");
}

/** Derives the affected resource type from a workspace event type. */
export function getResourceTypeForEvent(
  type: WorkspaceEventType
): WorkspaceEventResourceType {
  const [resourceType] = type.split("_");

  if (
    resourceType === "post" ||
    resourceType === "category" ||
    resourceType === "tag" ||
    resourceType === "media" ||
    resourceType === "author"
  ) {
    return resourceType;
  }

  return "workspace";
}
