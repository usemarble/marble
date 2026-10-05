import { ORPCError, ValidationError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import { authorSchema, socialPlatformSchema } from "../lib/author-validation";
import {
  AuthorError,
  createAuthor,
  deleteAuthor,
  listAuthors,
  updateAuthor,
} from "../services/authors";

const workspaceInput = z.object({ workspaceId: z.string().min(1) });
const authorInput = workspaceInput.extend({ id: z.string() });
const socialDto = z.object({
  id: z.string(),
  url: z.string(),
  platform: socialPlatformSchema,
});
const authorDto = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  role: z.string().nullable(),
  bio: z.string().nullable(),
  slug: z.string(),
  email: z.string().nullable(),
  userId: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  socials: z.array(socialDto),
});
const writeDto = authorDto.extend({
  workspaceId: z.string(),
  socials: z.array(
    socialDto.extend({
      authorId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  ),
});
const errorCodes = {
  400: "BAD_REQUEST",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_SERVER_ERROR",
} as const;

// Translate the CMS's errors at the transport boundary; services know no oRPC.
const authorsProcedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof AuthorError) {
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

export const authorsRouter = {
  list: authorsProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/authors",
      tags: ["Authors"],
      summary: "List active dashboard authors",
    })
    .input(workspaceInput)
    .output(z.array(authorDto))
    .handler(async ({ context }) =>
      z.array(authorDto).parse(await listAuthors(context, context.workspaceId))
    ),
  create: authorsProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/authors",
      tags: ["Authors"],
      summary: "Create a dashboard author",
    })
    .input(authorSchema.extend(workspaceInput.shape))
    .output(writeDto)
    .handler(async ({ context, input }) =>
      writeDto.parse(
        await createAuthor(
          context,
          context.workspaceId,
          context.session.user,
          input
        )
      )
    ),
  update: authorsProcedure
    .route({
      method: "PATCH",
      path: "/workspaces/{workspaceId}/authors/{id}",
      tags: ["Authors"],
      summary: "Update a dashboard author",
    })
    .input(authorSchema.extend(authorInput.shape))
    .output(writeDto)
    .handler(async ({ context, input }) =>
      writeDto.parse(
        await updateAuthor(
          context,
          context.workspaceId,
          input.id,
          context.session.user,
          input
        )
      )
    ),
  delete: authorsProcedure
    .route({
      method: "DELETE",
      path: "/workspaces/{workspaceId}/authors/{id}",
      tags: ["Authors"],
      summary: "Delete a dashboard author",
    })
    .input(authorInput)
    .output(z.string())
    .handler(({ context, input }) =>
      deleteAuthor(context, context.workspaceId, input.id, context.session.user)
    ),
};
