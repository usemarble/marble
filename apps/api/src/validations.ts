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
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 1 : Math.max(1, num);
    })
    .default("1"),
  order: OrderSchema,
  category: z.string().optional(),
  exclude: z
    .string()
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .optional(),
  tags: z
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .optional(),
  query: z.string().optional(),
});

export const BasicPaginationSchema = z.object({
  limit: z
    .string()
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 10 : Math.max(1, Math.min(100, num));
    })
    .default("10"),
  page: z
    .string()
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 1 : Math.max(1, num);
    })
    .default("1"),
});
