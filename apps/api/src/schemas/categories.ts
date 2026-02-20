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

export const CreateCategoryBodySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .openapi({ example: "Technology" }),
    slug: z
      .string()
      .slugify()
      .min(1, "Slug cannot be empty")
      .openapi({ example: "technology" }),
    description: z
      .string()
      .optional()
      .openapi({ example: "Tech news and tutorials" }),
  })
  .openapi("CreateCategoryBody");

export const CreateCategoryResponseSchema = z
  .object({
    category: z.object({
      id: z.string().openapi({ example: "cryitfjp2345kl05weoybfk9" }),
      name: z.string().openapi({ example: "Technology" }),
      slug: z.string().openapi({ example: "technology" }),
      description: z
        .string()
        .nullable()
        .openapi({ example: "Tech news and tutorials" }),
    }),
  })
  .openapi("CreateCategoryResponse");

export const UpdateCategoryBodySchema = z
  .object({
    name: z
      .string()
      .min(1, "Name cannot be empty")
      .optional()
      .openapi({ example: "Engineering" }),
    slug: z
      .string()
      .slugify()
      .min(1, "Slug cannot be empty")
      .optional()
      .openapi({ example: "engineering" }),
    description: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: "Engineering articles and tutorials" }),
  })
  .openapi("UpdateCategoryBody");
