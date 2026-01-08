import { z } from "@hono/zod-openapi";

// ============================================
// Pagination
// ============================================
export const PaginationSchema = z
  .object({
    limit: z.number().int().positive().openapi({ example: 10 }),
    currentPage: z.number().int().positive().openapi({ example: 1 }),
    nextPage: z.number().int().nullable().openapi({ example: 2 }),
    previousPage: z.number().int().nullable().openapi({ example: null }),
    totalPages: z.number().int().openapi({ example: 5 }),
    totalItems: z.number().int().openapi({ example: 42 }),
  })
  .openapi("Pagination");

// ============================================
// Error Responses
// ============================================
export const ErrorDetailSchema = z.object({
  field: z.string().openapi({ example: "limit" }),
  message: z.string().openapi({ example: "Expected number, received string" }),
});

// Used for 400 Bad Request (validation errors)
export const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: "Invalid query parameters" }),
    details: z.array(ErrorDetailSchema).optional(),
    message: z.string().optional().openapi({ example: "Validation failed" }),
  })
  .openapi("Error");

// Used for 500 Internal Server Error
export const ServerErrorSchema = z
  .object({
    error: z.string().openapi({ example: "Internal server error" }),
    message: z
      .string()
      .optional()
      .openapi({ example: "Failed to fetch resource" }),
  })
  .openapi("ServerError");

export const NotFoundSchema = z
  .object({
    error: z.string().openapi({ example: "Post not found" }),
    message: z
      .string()
      .openapi({ example: "The requested resource does not exist" }),
  })
  .openapi("NotFound");

export const PageNotFoundSchema = z
  .object({
    error: z.literal("Invalid page number"),
    details: z.object({
      message: z.string().openapi({ example: "Page 10 does not exist." }),
      totalPages: z.number().int().openapi({ example: 5 }),
      requestedPage: z.number().int().openapi({ example: 10 }),
    }),
  })
  .openapi("PageNotFound");

// ============================================
// Common Query Parameters
// ============================================
export const LimitQuerySchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(10)
  .openapi({
    param: { name: "limit", in: "query" },
    example: "10",
    description: "Number of items per page (1-100)",
  });

export const PageQuerySchema = z.coerce
  .number()
  .int()
  .positive()
  .default(1)
  .openapi({
    param: { name: "page", in: "query" },
    example: "1",
    description: "Page number",
  });

export const IdentifierParamSchema = z.string().openapi({
  param: { name: "identifier", in: "path" },
  example: "my-post-slug",
  description: "ID or slug of the resource",
});

// ============================================
// Content Format (for posts)
// ============================================
export const ContentFormatSchema = z
  .enum(["html", "markdown"])
  .openapi("ContentFormat");
