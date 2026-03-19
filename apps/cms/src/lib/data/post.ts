import type { PostValues } from "../validations/post";

function todayUTCMidnight() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export const emptyPost: PostValues = {
  title: "",
  slug: "",
  status: "draft" as const,
  content: "",
  contentJson: JSON.stringify({ type: "doc", content: [] }),
  coverImage: null,
  description: "",
  publishedAt: todayUTCMidnight(),
  attribution: null,
  tags: [],
  category: "",
  authors: [],
};
