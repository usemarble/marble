import { z } from "zod";

// Schema for importing posts where the client sends markdown only and
// the server derives HTML and Tiptap JSON.
export const postImportSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }),
  coverImage: z.string().url().nullable().optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  slug: z.string().slugify().min(1, { message: "Slug cannot be empty" }),
  // Markdown content
  content: z.string().min(1),
  tags: z.array(z.string().min(1)).optional(),
  // Authors optional; backend will fallback to current user's author
  authors: z.array(z.string().min(1)).optional(),
  category: z.string().min(1, { message: "Category is required" }),
  status: z.enum(["published", "draft"]),
  featured: z.boolean().default(false),
  publishedAt: z.coerce.date(),
});

export type PostImportValues = z.infer<typeof postImportSchema>;
