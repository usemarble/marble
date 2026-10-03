import { ORPCError, ValidationError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import { customFieldsPayloadSchema } from "../lib/custom-fields";
import { postUpsertSchema } from "../lib/post-validation";
import {
  createPost,
  deletePost,
  getPost,
  getPostFields,
  listPostFields,
  listPosts,
  PostError,
  updatePost,
  updatePostFields,
} from "../services/posts";

const workspaceInput = z.object({ workspaceId: z.string().min(1) });
const postInput = workspaceInput.extend({ id: z.string() });
const idOutput = z.object({ id: z.string() });
const postStatus = z.enum(["published", "draft"]);
const fieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  key: z.string(),
  type: z.enum([
    "text",
    "number",
    "boolean",
    "date",
    "richtext",
    "select",
    "multiselect",
  ]),
  required: z.boolean(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  hasValues: z.boolean().optional(),
  options: z.array(
    z.object({
      id: z.string(),
      fieldId: z.string(),
      workspaceId: z.string(),
      value: z.string(),
      label: z.string(),
      position: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
  ),
});

const errorCodes = {
  400: "BAD_REQUEST",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_SERVER_ERROR",
} as const;

// Translate the CMS's errors at the transport boundary; services know no oRPC.
const postsProcedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof PostError) {
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

export const postsRouter = {
  list: postsProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/posts",
      tags: ["Posts"],
      summary: "List dashboard posts",
    })
    .input(
      workspaceInput.extend({
        category: z.string().default("all"),
        page: z.number().default(1),
        perPage: z.number().default(20),
        search: z.string().default(""),
        sort: z.string().default("createdAt_desc"),
        status: z.enum(["all", "published", "draft"]).default("all"),
      })
    )
    .output(
      z.object({
        hasAnyPosts: z.boolean(),
        pageCount: z.number(),
        totalCount: z.number(),
        posts: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            coverImage: z.string().nullable(),
            status: postStatus,
            featured: z.boolean(),
            publishedAt: z.date(),
            updatedAt: z.date(),
            category: z.object({ id: z.string(), name: z.string() }),
            authors: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                image: z.string().nullable(),
              })
            ),
          })
        ),
      })
    )
    .handler(({ context, input }) =>
      listPosts(context, context.workspaceId, input)
    ),
  get: postsProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/posts/{id}",
      tags: ["Posts"],
      summary: "Get a post for the editor",
    })
    .input(postInput)
    .output(
      z.object({
        slug: z.string(),
        title: z.string(),
        status: postStatus,
        featured: z.boolean(),
        content: z.string(),
        coverImage: z.string().nullable(),
        description: z.string(),
        publishedAt: z.date(),
        contentJson: z.string(),
        tags: z.array(z.string()),
        category: z.string(),
        authors: z.array(z.string()),
      })
    )
    .handler(({ context, input }) =>
      getPost(context, context.workspaceId, input.id)
    ),
  create: postsProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/posts",
      tags: ["Posts"],
      summary: "Create a dashboard post",
    })
    .input(postUpsertSchema.extend(workspaceInput.shape))
    .output(idOutput)
    .handler(({ context, input }) =>
      createPost(context, context.workspaceId, context.session.user, input)
    ),
  update: postsProcedure
    .route({
      method: "PATCH",
      path: "/workspaces/{workspaceId}/posts/{id}",
      tags: ["Posts"],
      summary: "Update a dashboard post",
    })
    .input(postUpsertSchema.extend(postInput.shape))
    .output(idOutput)
    .handler(({ context, input }) =>
      updatePost(
        context,
        context.workspaceId,
        input.id,
        context.session.user,
        input
      )
    ),
  delete: postsProcedure
    .route({
      method: "DELETE",
      path: "/workspaces/{workspaceId}/posts/{id}",
      tags: ["Posts"],
      summary: "Delete a dashboard post",
    })
    .input(postInput)
    .output(idOutput)
    .handler(({ context, input }) =>
      deletePost(context, context.workspaceId, input.id, context.session.user)
    ),
  fields: {
    list: postsProcedure
      .route({
        method: "GET",
        path: "/workspaces/{workspaceId}/posts/fields",
        tags: ["Posts"],
        summary: "List fields for the new-post editor",
      })
      .input(workspaceInput)
      .output(z.array(fieldSchema))
      .handler(({ context }) => listPostFields(context, context.workspaceId)),
    get: postsProcedure
      .route({
        method: "GET",
        path: "/workspaces/{workspaceId}/posts/{id}/fields",
        tags: ["Posts"],
        summary: "Get a post's custom fields",
      })
      .input(postInput)
      .output(
        z.object({
          fields: z.array(fieldSchema),
          values: z.record(z.string(), z.string()),
        })
      )
      .handler(({ context, input }) =>
        getPostFields(context, context.workspaceId, input.id)
      ),
    update: postsProcedure
      .route({
        method: "PUT",
        path: "/workspaces/{workspaceId}/posts/{id}/fields",
        tags: ["Posts"],
        summary: "Update a post's custom fields",
      })
      .input(postInput.extend({ values: customFieldsPayloadSchema }))
      .output(z.object({ success: z.boolean() }))
      .handler(({ context, input }) =>
        updatePostFields(context, context.workspaceId, input.id, input.values)
      ),
  },
};
