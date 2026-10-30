import { POST_STATUSES } from "@marble/utils/post-status";
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
  coverImage: z.url().nullable().optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  slug: z.string().slugify().min(1, { message: "Slug cannot be empty" }),
  content: z.string(),
  contentJson: validJsonString,
  tags: z.array(z.string().min(1)).optional(),
  authors: z.array(z.string().min(1)).optional(),
  category: z.string().min(1, { message: "Category is required" }),
  status: z.enum(POST_STATUSES),
  featured: z.boolean().default(false).optional(),
  publishedAt: z.coerce.date(),
});

export type PostValues = z.infer<typeof postSchema>;

/** The form owns content and metadata. Status and go-live time are server state. */
export const postEditorSchema = postSchema
  .omit({ status: true, publishedAt: true })
  .extend({
    customFields: z.record(z.string(), z.string()).default({}),
  });

export type PostEditorValues = z.infer<typeof postEditorSchema>;

export const postUpsertSchema = postSchema.extend({
  customFields: z
    .record(z.string(), z.union([z.string(), z.null()]))
    .default({}),
});

export type PostUpsertValues = z.infer<typeof postUpsertSchema>;

export const postPublicationChangeSchema = z.object({
  status: z.enum(POST_STATUSES),
  publishedAt: z.coerce.date().optional(),
  /** The status the user saw. A mismatch means the post changed under them. */
  expectedStatus: z.enum(POST_STATUSES),
});

/** A save leaves `publication` out, so it can never move a post's go-live time. */
export const postUpdateSchema = postUpsertSchema
  .omit({ status: true, publishedAt: true })
  .extend({
    publication: postPublicationChangeSchema.optional(),
  });

export type PostUpdateValues = z.infer<typeof postUpdateSchema>;
