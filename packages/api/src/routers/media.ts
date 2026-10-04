import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import {
  deleteMedia,
  getMedia,
  listEditorMedia,
  listMedia,
  MediaError,
  updateMedia,
} from "../services/media";

const base = z.object({ workspaceId: z.string().min(1) });
const resource = base.extend({ id: z.string().min(1) });
const sort = z.enum([
  "createdAt_asc",
  "createdAt_desc",
  "name_asc",
  "name_desc",
]);
const mediaDto = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  alt: z.string().nullable(),
  createdAt: z.string(),
  type: z.enum(["image", "video", "audio", "document"]),
  size: z.number(),
  mimeType: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration: z.number().nullable(),
  blurHash: z.string().nullable(),
});
const listInput = base.extend({
  page: z.number().int().min(1),
  perPage: z.number().int().min(1).max(100),
  search: z.string().nullish(),
  sort,
  type: z.enum(["image", "video", "audio", "document"]).nullish(),
});
const mediaProcedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof MediaError) {
      throw new ORPCError(
        error.status === 404
          ? "NOT_FOUND"
          : error.status === 400
            ? "BAD_REQUEST"
            : "INTERNAL_SERVER_ERROR",
        { message: error.message, cause: error }
      );
    }
    throw error;
  }
});
export const mediaRouter = {
  list: mediaProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/media",
      tags: ["Media"],
    })
    .input(listInput)
    .output(
      z.object({
        media: z.array(mediaDto),
        pageCount: z.number(),
        totalCount: z.number(),
        hasAnyMedia: z.boolean(),
      })
    )
    .handler(({ context, input }) =>
      listMedia(context, context.workspaceId, input)
    ),
  editor: mediaProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/media/editor",
      tags: ["Media"],
    })
    .input(
      base.extend({
        cursor: z.string().nullish(),
        limit: z.number().int().min(1).max(100),
        sort: sort.default("createdAt_desc"),
      })
    )
    .output(
      z.object({
        media: z.array(mediaDto),
        nextCursor: z.string().optional(),
        hasAnyMedia: z.boolean(),
      })
    )
    .handler(({ context, input }) =>
      listEditorMedia(context, context.workspaceId, input)
    ),
  get: mediaProcedure
    .route({
      method: "GET",
      path: "/workspaces/{workspaceId}/media/{id}",
      tags: ["Media"],
    })
    .input(resource)
    .output(mediaDto)
    .handler(({ context, input }) =>
      getMedia(context, context.workspaceId, input.id)
    ),
  update: mediaProcedure
    .route({
      method: "PATCH",
      path: "/workspaces/{workspaceId}/media/{id}",
      tags: ["Media"],
    })
    .input(
      resource.extend({
        name: z.string().trim().min(1).max(255),
        alt: z.string().trim().max(1000).nullable(),
      })
    )
    .output(mediaDto)
    .handler(({ context, input }) =>
      updateMedia(
        context,
        context.workspaceId,
        input.id,
        input,
        context.session.user.id
      )
    ),
  delete: mediaProcedure
    .route({
      method: "DELETE",
      path: "/workspaces/{workspaceId}/media",
      tags: ["Media"],
    })
    .input(base.extend({ mediaIds: z.array(z.string()).min(1).max(100) }))
    .output(
      z.object({
        deletedIds: z.array(z.string()),
        failedIds: z.array(z.string()).optional(),
        message: z.string(),
      })
    )
    .handler(({ context, input }) =>
      deleteMedia(
        context,
        context.workspaceId,
        input.mediaIds,
        context.session.user.id
      )
    ),
};
