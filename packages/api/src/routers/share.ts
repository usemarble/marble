import { ORPCError, ValidationError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure, workspaceProcedure } from "../index";
import { createShareLink, getShareLink, ShareError } from "../services/share";

const createDto = z.object({ shareLink: z.string(), expiresAt: z.date() });
const taxonomyDto = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
const previewDto = z.object({
  post: z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    contentJson: z.unknown(),
    description: z.string(),
    coverImage: z.string().nullable(),
    status: z.enum(["draft", "published"]),
    createdAt: z.date(),
    updatedAt: z.date(),
    publishedAt: z.date(),
    authors: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        image: z.string().nullable(),
        bio: z.string().nullable(),
      })
    ),
    category: taxonomyDto,
    tags: z.array(taxonomyDto),
    workspace: z.object({
      id: z.string(),
      name: z.string(),
      logo: z.string().nullable(),
      slug: z.string(),
    }),
  }),
  expiresAt: z.date(),
});
const errorCodes = {
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  410: "SHARE_EXPIRED",
  500: "INTERNAL_SERVER_ERROR",
} as const;

async function translateError<T>(work: () => Promise<T>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ShareError) {
      throw new ORPCError(errorCodes[error.status], {
        status: error.status,
        message: error.message,
        cause: error,
      });
    }
    throw error;
  }
}

export const shareRouter = {
  create: workspaceProcedure
    .use(async ({ next }) => {
      try {
        return await next();
      } catch (error) {
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
    })
    .route({
      method: "POST",
      path: "/workspaces/{workspaceId}/share",
      tags: ["Share links"],
      summary: "Create or reuse a draft share link",
    })
    .input(
      z.object({
        workspaceId: z.string().min(1),
        postId: z.string().min(1, { message: "Post ID is required" }),
      })
    )
    .output(createDto)
    .handler(({ context, input }) =>
      translateError(() =>
        createShareLink(context, context.workspaceId, input.postId)
      )
    ),
  get: publicProcedure
    .errors({
      SHARE_EXPIRED: { status: 410, message: "Share link has expired" },
    })
    .use(({ context, next }) => {
      // Set before reading so expired and invalid previews are also never cached.
      context.resHeaders?.set("Cache-Control", "no-store");
      return next();
    })
    .route({
      method: "GET",
      path: "/share/{token}",
      tags: ["Share links"],
      summary: "Read a public draft preview",
    })
    .input(z.object({ token: z.string() }))
    .output(previewDto)
    .handler(({ context, input }) =>
      translateError(async () =>
        previewDto.parse(await getShareLink(context, input.token))
      )
    ),
};
