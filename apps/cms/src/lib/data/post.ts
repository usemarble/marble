import type { PostValues } from "../validations/post";

export const emptyPost: PostValues = {
  title: "",
  slug: "",
  status: "draft" as const,
  content: "",
  contentJson: JSON.stringify({ type: "doc", content: [] }),
  coverImage: null,
  description: "",
  publishedAt: new Date(),
  attribution: null,
  tags: [],
  category: "",
  authors: [],
};
