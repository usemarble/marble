import { POST_STATUSES, POST_WRITE_STATUSES } from "@marble/utils/post-status";
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

const postFields = {
  title: z.string().min(1, { message: "Title cannot be empty" }),
  coverImage: z.url().nullable().optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  slug: z.string().slugify().min(1, { message: "Slug cannot be empty" }),
  content: z.string(),
  contentJson: validJsonString,
  tags: z.array(z.string().min(1)).optional(),
  authors: z.array(z.string().min(1)).optional(),
  category: z.string().min(1, { message: "Category is required" }),
  featured: z.boolean().default(false).optional(),
  publishedAt: z.coerce.date(),
};

export const postReadSchema = z.object({
  ...postFields,
  status: z.enum(POST_STATUSES),
});

export type PostReadValues = z.infer<typeof postReadSchema>;

export const postWriteSchema = z.object({
  ...postFields,
  status: z.enum(POST_WRITE_STATUSES),
});

export type PostWriteValues = z.infer<typeof postWriteSchema>;

export const postEditorSchema = postReadSchema.extend({
  customFields: z.record(z.string(), z.string()).default({}),
});

export type PostEditorValues = z.infer<typeof postEditorSchema>;

export const postUpsertSchema = postWriteSchema.extend({
  customFields: z
    .record(z.string(), z.union([z.string(), z.null()]))
    .default({}),
});

export type PostUpsertValues = z.infer<typeof postUpsertSchema>;
