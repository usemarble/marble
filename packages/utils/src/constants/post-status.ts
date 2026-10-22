export const POST_STATUSES = ["published", "draft", "scheduled"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const PUBLIC_POST_STATUSES = [
  "published",
  "draft",
] as const satisfies readonly PostStatus[];
