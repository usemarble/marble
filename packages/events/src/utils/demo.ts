import type { EventPayload } from "../types";

/** Returns the fixed demo payload used by webhook test sends. */
export function getDemoPostPublishedPayload(): EventPayload {
  const now = new Date().toISOString();

  return {
    id: "test_post",
    test: true,
    title: "Test post",
    slug: "test-post",
    description: "This is a test webhook event from Marble.",
    coverImage: null,
    status: "published",
    featured: false,
    categoryId: "test_category",
    primaryAuthorId: "test_author",
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}
