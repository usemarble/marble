import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import {
  completeUpload,
  initiateUpload,
  UploadError,
} from "../services/uploads";

const base = z.object({ workspaceId: z.string().min(1) });
const type = z.enum(["avatar", "author-avatar", "logo", "media", "import"]);
const uploadProcedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof UploadError) {
      const code =
        error.status === 403
          ? "FORBIDDEN"
          : error.status === 404
            ? "NOT_FOUND"
            : error.status === 429
              ? "TOO_MANY_REQUESTS"
              : error.status === 500
                ? "INTERNAL_SERVER_ERROR"
                : "BAD_REQUEST";
      throw new ORPCError(code, { message: error.message, cause: error });
    }
    throw error;
  }
});
const mediaDto = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  alt: z.string().nullable(),
  size: z.number(),
  mimeType: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration: z.number().nullable(),
  blurHash: z.string().nullable(),
  type: z.enum(["image", "video", "audio", "document"]),
  createdAt: z.string(),
});

export const uploadsRouter = {
  initiate: uploadProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/uploads",
      tags: ["Uploads"],
    })
    .input(
      base.extend({
        type,
        fileType: z.string().min(1),
        fileSize: z.number().int().positive(),
        fileName: z.string().optional(),
      })
    )
    .output(
      z.object({
        url: z.string(),
        key: z.string(),
        token: z.string(),
        headers: z.record(z.string(), z.string()),
      })
    )
    .handler(({ context, input }) =>
      initiateUpload(
        context,
        context.session.user,
        context.workspaceId,
        context.role,
        input
      )
    ),
  complete: uploadProcedure
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/uploads/complete",
      tags: ["Uploads"],
    })
    .input(
      base.extend({
        type,
        token: z.string().min(1),
        key: z.string().min(1),
        fileType: z.string().min(1),
        fileSize: z.number().int().positive(),
        name: z.string().min(1).max(255).optional(),
        mimeType: z.string().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        duration: z.number().int().nonnegative().optional(),
        blurHash: z.string().optional(),
      })
    )
    .output(z.union([mediaDto, z.object({ url: z.string() })]))
    .handler(({ context, input }) =>
      completeUpload(
        context,
        context.session.user,
        context.workspaceId,
        context.role,
        input
      )
    ),
};
