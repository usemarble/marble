import { z } from "zod";

export const OrderSchema = z.enum(["asc", "desc"]).default("desc");

export const PostsQuerySchema = z.object({
  limit: z
    .union([
      z.literal("all"),
      z.string().transform((val) => {
        const num = Number.parseInt(val, 10);
        return Number.isNaN(num) ? 10 : Math.max(1, num);
      }),
      z.number().positive(),
    ])
    .default(10),
  page: z
    .string()
    .default("1")
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 1 : Math.max(1, num);
    }),
  order: OrderSchema,
  author: z.string().optional(),
  categories: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    .optional(),
  excludeCategories: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    .optional(),
  tags: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    .optional(),
  excludeTags: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    .optional(),
  query: z.string().optional(),
});

export const PostQuerySchema = z.object({
  include: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    .optional(),
});
