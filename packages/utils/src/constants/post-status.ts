export const POST_STATUSES = ["published", "draft", "scheduled"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_WRITE_STATUSES = [
  "published",
  "draft",
] as const satisfies readonly PostStatus[];

export const PUBLIC_POST_STATUSES = [
  "published",
  "draft",
] as const satisfies readonly PostStatus[];

export const POST_STATUS_POLICY = {
  published: { editable: true, publicContract: true },
  draft: { editable: true, publicContract: true },
  scheduled: { editable: false, publicContract: false },
} as const satisfies Record<
  PostStatus,
  { editable: boolean; publicContract: boolean }
>;
