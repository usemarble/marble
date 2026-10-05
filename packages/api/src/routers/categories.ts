import { ORPCError, ValidationError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import { categorySchema } from "../lib/taxonomy-validation";
import {
  CategoryError,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../services/categories";

const workspaceInput = z.object({ workspaceId: z.string().min(1) });
const resourceInput = workspaceInput.extend({ id: z.string() });
const taxonomyDto = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
});
const writeDto = taxonomyDto.extend({
  workspaceId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
const errorCodes = {
  400: "BAD_REQUEST",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_SERVER_ERROR",
} as const;

// Translate the CMS's errors at the transport boundary; services know no oRPC.
const categoriesProcedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof CategoryError) {
      throw new ORPCError(errorCodes[error.status], {
        message: error.message,
        data: error.data,
        cause: error,
      });
    }
    if (
      error instanceof ORPCError &&
      error.code === "BAD_REQUEST" &&
      error.cause instanceof ValidationError
    ) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid request body",
        data: { details: error.cause.issues },
        cause: error,
      });
    }
    throw error;
  }
});

export const categoriesRouter = {
  list: categoriesProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/categories",
      tags: ["Categories"],
      summary: "List dashboard categories",
    })
    .input(workspaceInput)
    .output(z.array(taxonomyDto.extend({ postsCount: z.number() })))
    .handler(({ context }) => listCategories(context, context.workspaceId)),
  create: categoriesProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/categories",
      tags: ["Categories"],
      summary: "Create a dashboard category",
    })
    .input(categorySchema.extend(workspaceInput.shape))
    .output(writeDto)
    .handler(({ context, input }) =>
      createCategory(context, context.workspaceId, context.session.user, input)
    ),
  update: categoriesProcedure
    .route({
      method: "PATCH",
      path: "/workspaces/{workspaceId}/categories/{id}",
      tags: ["Categories"],
      summary: "Update a dashboard category",
    })
    .input(categorySchema.extend(resourceInput.shape))
    .output(writeDto)
    .handler(({ context, input }) =>
      updateCategory(
        context,
        context.workspaceId,
        input.id,
        context.session.user,
        input
      )
    ),
  delete: categoriesProcedure
    .route({
      method: "DELETE",
      path: "/workspaces/{workspaceId}/categories/{id}",
      tags: ["Categories"],
      summary: "Delete a dashboard category",
    })
    .input(resourceInput)
    .output(z.void())
    .handler(({ context, input }) =>
      deleteCategory(
        context,
        context.workspaceId,
        input.id,
        context.session.user
      )
    ),
};
