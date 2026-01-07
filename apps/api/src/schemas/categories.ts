import { z } from "@hono/zod-openapi";
import { PaginationSchema } from "./common";

// ============================================
// Category Schema
// ============================================
export const CategorySchema = z
  .object({
    id: z.string().openapi({ example: "clx456def" }),
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

// ============================================
// Response Schemas
// ============================================
export const CategoriesListResponseSchema = z
  .object({
    categories: z.array(CategorySchema),
    pagination: PaginationSchema,
  })
  .openapi("CategoriesListResponse");

export const SingleCategoryResponseSchema = z
  .object({
    category: CategorySchema,
  })
  .openapi("SingleCategoryResponse");
