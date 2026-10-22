import type { PostWriteValues } from "./post-validation";

function todayUTCMidnight() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export const emptyPost: PostWriteValues = {
  title: "",
  slug: "",
  status: "draft" as const,
  content: "",
  contentJson: JSON.stringify({ type: "doc", content: [] }),
  coverImage: null,
  description: "",
  publishedAt: todayUTCMidnight(),
  tags: [],
  category: "",
  authors: [],
};
