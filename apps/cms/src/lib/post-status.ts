import type { PostStatus } from "@marble/utils/post-status";

export const POST_STATUS_PRESENTATION = {
  published: {
    label: "Published",
    variant: "positive",
    dateLabel: "Published",
  },
  draft: { label: "Draft", variant: "pending", dateLabel: "Publish date" },
  scheduled: {
    label: "Scheduled",
    variant: "info",
    dateLabel: "Scheduled for",
  },
} satisfies Record<
  PostStatus,
  {
    label: string;
    variant: "positive" | "pending" | "info";
    dateLabel: string;
  }
>;

export function formatScheduledDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "long",
  }).format(date);
}
