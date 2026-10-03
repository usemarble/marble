import { z } from "zod";

const validJsonString = z
  .string()
  .min(10)
  .refine(
    (value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Content JSON must be valid JSON" }
  );

export const postSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }),
  coverImage: z.string().url().nullable().optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  slug: z.string().slugify().min(1, { message: "Slug cannot be empty" }),
  content: z.string(),
  contentJson: validJsonString,
  tags: z.array(z.string().min(1)).optional(),
  authors: z.array(z.string().min(1)).optional(),
  category: z.string().min(1, { message: "Category is required" }),
  status: z.enum(["published", "draft"]),
  featured: z.boolean().default(false).optional(),
  publishedAt: z.coerce.date(),
});

export type PostValues = z.infer<typeof postSchema>;

export const postEditorSchema = postSchema.extend({
  customFields: z.record(z.string(), z.string()).default({}),
});

export type PostEditorValues = z.infer<typeof postEditorSchema>;

export const postUpsertSchema = postSchema.extend({
  customFields: z
    .record(z.string(), z.union([z.string(), z.null()]))
    .default({}),
});

export type PostUpsertValues = z.infer<typeof postUpsertSchema>;
