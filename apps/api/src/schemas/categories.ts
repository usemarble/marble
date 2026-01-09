import { z } from "@hono/zod-openapi";
import { PaginationSchema } from "./common";

export const CategorySchema = z
  .object({
    id: z.string().openapi({ example: "cryitfjp2345kl05weoybfk9" }),
    name: z.string().openapi({ example: "Technology" }),
    slug: z.string().openapi({ example: "technology" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "Tech news and tutorials" }),
    count: z
      .object({
        posts: z.number().int().openapi({ example: 15 }),
      })
      .openapi({ description: "Number of published posts in this category" }),
  })
  .openapi("Category");

export const CategoriesListResponseSchema = z
  .object({
    categories: z.array(CategorySchema),
    pagination: PaginationSchema,
  })
  .openapi("CategoriesListResponse");

export const CategoryResponseSchema = z
  .object({
    category: CategorySchema,
  })
  .openapi("CategoryResponse");
