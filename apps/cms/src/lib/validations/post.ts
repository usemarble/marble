import { z } from "zod";

const stripHtmlTags = (html: string) => {
  return html.replace(/<[^>]*>/g, "").trim();
};

const requiredEditorString = z
  .string({ required_error: "You forgot to write your awesome story..." })
  .refine(
    (val) => {
      const strippedText = stripHtmlTags(val);
      return strippedText.length > 0;
    },
    { message: "You have not written anything yet." },
  );

export const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(100, "Title is too long"),
  coverImage: z.string().url().nullable().optional(),
  description: z.string().min(1),
  slug: z.string().min(1),
  content: requiredEditorString,
  contentJson: z.string().min(10),
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
  category: z.string().min(1, "Category is required").uuid(),
});

export type PostValues = z.infer<typeof postSchema>;

export const draftSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(100, "Title is too long"),
  coverImage: z.string().url().nullable().optional(),
  description: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: requiredEditorString,
  tags: z.array(z.string().min(1)).min(1, "At least one tag is required"),
});

export type DraftValues = z.infer<typeof draftSchema>;

const signInSchema = z.object({
  email: z.string().email().min(3).max(50),
  password: z.string().min(8).max(30),
});

export type SignInValues = z.infer<typeof signInSchema>;
