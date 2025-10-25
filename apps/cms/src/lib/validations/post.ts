import { z } from "zod";

const attributionSchema = z.object({
  author: z.string().min(1, "Author name is required"),
  url: z.string().url("Please enter a valid URL"),
});

export type Attribution = z.infer<typeof attributionSchema>;

export const postSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title cannot be empty" })
    .max(100, { message: "Title is too long" }),
  coverImage: z.string().url().nullable().optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  slug: z.string().min(1, { message: "Slug cannot be empty" }),
  content: z.string(),
  contentJson: z.string().min(10),
  tags: z.array(z.string().min(1)).optional(),
  authors: z.array(z.string().min(1)).optional(),
  category: z.string().min(1, { message: "Category is required" }),
  status: z.enum(["published", "draft"]),
  featured: z.boolean().default(false).optional(),
  publishedAt: z.coerce.date(),
  attribution: attributionSchema.nullable().optional(),
});

export type PostValues = z.infer<typeof postSchema>;

export const shareLinkSchema = z.object({
  postId: z.string().min(1, { message: "Post ID is required" }),
});

export type ShareLinkValues = z.infer<typeof shareLinkSchema>;

// Schema for importing posts where the client sends markdown only and
// the server derives HTML and Tiptap JSON.
export const postImportSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title cannot be empty" })
    .max(100, { message: "Title is too long" }),
  coverImage: z.string().url().nullable().optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  slug: z.string().min(1, { message: "Slug cannot be empty" }),
  // Markdown content
  content: z.string().min(1),
  tags: z.array(z.string().min(1)).optional(),
  // Authors optional; backend will fallback to current user's author
  authors: z.array(z.string().min(1)).optional(),
  category: z.string().min(1, { message: "Category is required" }),
  status: z.enum(["published", "draft"]),
  featured: z.boolean().default(false),
  publishedAt: z.coerce.date(),
  attribution: attributionSchema.nullable().optional(),
});

export type PostImportValues = z.infer<typeof postImportSchema>;
