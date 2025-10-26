import { z } from "zod";

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
