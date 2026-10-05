import { ORPCError, ValidationError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import { tagSchema } from "../lib/taxonomy-validation";
import {
  createTag,
  deleteTag,
  listTags,
  TagError,
  updateTag,
} from "../services/tags";

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
const tagsProcedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TagError) {
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

export const tagsRouter = {
  list: tagsProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/tags",
      tags: ["Tags"],
      summary: "List dashboard tags",
    })
    .input(workspaceInput)
    .output(z.array(taxonomyDto.extend({ postsCount: z.number() })))
    .handler(({ context }) => listTags(context, context.workspaceId)),
  create: tagsProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/tags",
      tags: ["Tags"],
      summary: "Create a dashboard tag",
    })
    .input(tagSchema.extend(workspaceInput.shape))
    .output(writeDto)
    .handler(({ context, input }) =>
      createTag(context, context.workspaceId, context.session.user, input)
    ),
  update: tagsProcedure
    .route({
      method: "PATCH",
      path: "/workspaces/{workspaceId}/tags/{id}",
      tags: ["Tags"],
      summary: "Update a dashboard tag",
    })
    .input(tagSchema.extend(resourceInput.shape))
    .output(writeDto)
    .handler(({ context, input }) =>
      updateTag(
        context,
        context.workspaceId,
        input.id,
        context.session.user,
        input
      )
    ),
  delete: tagsProcedure
    .route({
      method: "DELETE",
      path: "/workspaces/{workspaceId}/tags/{id}",
      tags: ["Tags"],
      summary: "Delete a dashboard tag",
    })
    .input(resourceInput)
    .output(z.void())
    .handler(({ context, input }) =>
      deleteTag(context, context.workspaceId, input.id, context.session.user)
    ),
};
