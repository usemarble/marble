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
    .min(1, { message: "Title cannot be empty" })
    .max(100, { message: "Title is too long" }),
  coverImage: z.string().url().nullable().optional(),
  description: z.string().min(1, { message: "Description cannot be empty" }),
  slug: z.string().min(1, { message: "Slug cannot be empty" }),
  content: requiredEditorString,
  contentJson: z.string().min(10),
  tags: z
    .array(z.string().min(1))
    .min(1, { message: "At least one tag is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  status: z.enum(["published", "unpublished"]),
  publishedAt: z.string().datetime(),
});

export type PostValues = z.infer<typeof postSchema>;

const signInSchema = z.object({
  email: z.string().email().min(3).max(50),
  password: z.string().min(8).max(30),
});

export type SignInValues = z.infer<typeof signInSchema>;
