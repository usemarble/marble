import type { PostStatus } from "@marble/utils/post-status";

export interface PostPublication {
  status: PostStatus;
  publishedAt: Date;
}

export interface PostPublicationChange {
  status: PostStatus;
  publishedAt?: Date;
  expectedStatus: PostStatus;
}

export type PublicationRejection = "status_changed" | "go_live_not_in_future";

/**
 * Where a post's status and go-live time end up after a write. A write with no
 * change keeps both, so editing an overdue scheduled post still works.
 */
export function applyPublicationChange(
  stored: PostPublication,
  change: PostPublicationChange | undefined,
  now: Date
): PostPublication | PublicationRejection {
  if (!change) {
    return stored;
  }
  if (change.expectedStatus !== stored.status) {
    return "status_changed";
  }

  const publishingEarly =
    change.status === "published" &&
    stored.status !== "published" &&
    stored.publishedAt > now;
  const publishedAt =
    change.publishedAt ?? (publishingEarly ? now : stored.publishedAt);

  const setsGoLive =
    change.status === "scheduled" &&
    (stored.status !== "scheduled" ||
      publishedAt.getTime() !== stored.publishedAt.getTime());
  if (setsGoLive && publishedAt <= now) {
    return "go_live_not_in_future";
  }

  return { status: change.status, publishedAt };
}

export function postEventType(previous: PostStatus, next: PostStatus) {
  if (previous !== "published" && next === "published") {
    return "post_published";
  }
  if (previous === "published" && next !== "published") {
    return "post_unpublished";
  }
  return "post_updated";
}
