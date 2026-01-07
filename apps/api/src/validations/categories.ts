import { z } from "zod";

export const CategoriesQuerySchema = z.object({
  limit: z
    .string()
    .default("10")
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 10 : Math.max(1, Math.min(100, num));
    }),
  page: z
    .string()
    .default("1")
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 1 : Math.max(1, num);
    }),
});

export const CategoryQuerySchema = z.object({
  limit: z
    .string()
    .default("20")
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 20 : Math.max(1, Math.min(100, num));
    }),
  page: z
    .string()
    .default("1")
    .transform((val) => {
      const num = Number.parseInt(val, 10);
      return Number.isNaN(num) ? 1 : Math.max(1, num);
    }),
});
