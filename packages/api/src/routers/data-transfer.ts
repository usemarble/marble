import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { workspaceProcedure } from "../index";
import {
  createExport,
  createImport,
  DataTransferError,
  getExportDownload,
  listExports,
  listImports,
} from "../services/data-transfer";
import { UploadError } from "../services/uploads";

const base = z.object({ workspaceId: z.string().min(1) });
const date = z.string().nullable();
const exportDto = z.object({
  id: z.string(),
  status: z.enum(["queued", "processing", "ready", "failed", "expired"]),
  format: z.string(),
  fileSize: z.number().nullable(),
  expiresAt: date,
  createdAt: z.string(),
  completedAt: date,
  failedAt: date,
  errorMessage: z.string().nullable(),
});
const importDto = z.object({
  id: z.string(),
  source: z.enum(["file", "url"]),
  status: z.enum([
    "queued",
    "discovering",
    "processing",
    "review",
    "importing",
    "completed",
    "failed",
  ]),
  format: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  totalItems: z.number(),
  readyItems: z.number(),
  errorItems: z.number(),
  importedItems: z.number(),
  startedAt: date,
  completedAt: date,
  failedAt: date,
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
});
const procedure = workspaceProcedure.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof DataTransferError || error instanceof UploadError) {
      const code =
        error.status === 404
          ? "NOT_FOUND"
          : error.status === 410
            ? "GONE"
            : error.status === 403
              ? "FORBIDDEN"
              : error.status === 500
                ? "INTERNAL_SERVER_ERROR"
                : "BAD_REQUEST";
      throw new ORPCError(code, { message: error.message, cause: error });
    }
    throw error;
  }
});
export const dataTransferRouter = {
  exports: {
    list: procedure
      .route({
        method: "GET",
        path: "/workspaces/{workspaceId}/exports",
        tags: ["Exports"],
      })
      .input(base)
      .output(z.object({ jobs: z.array(exportDto) }))
      .handler(({ context }) => listExports(context, context.workspaceId)),
    create: procedure
      .route({
        method: "POST",
        path: "/workspaces/{workspaceId}/exports",
        tags: ["Exports"],
      })
      .input(base)
      .output(z.object({ job: exportDto }))
      .handler(({ context }) =>
        createExport(context, context.workspaceId, context.session.user.id)
      ),
    download: procedure
      .route({
        method: "POST",
        path: "/workspaces/{workspaceId}/exports/{id}/download",
        tags: ["Exports"],
      })
      .input(base.extend({ id: z.string().min(1) }))
      .output(z.object({ url: z.string() }))
      .handler(({ context, input }) =>
        getExportDownload(context, context.workspaceId, input.id)
      ),
  },
  imports: {
    list: procedure
      .route({
        method: "GET",
        path: "/workspaces/{workspaceId}/imports",
        tags: ["Imports"],
      })
      .input(base)
      .output(z.object({ jobs: z.array(importDto) }))
      .handler(({ context }) => listImports(context, context.workspaceId)),
    create: procedure
      .route({
        method: "POST",
        path: "/workspaces/{workspaceId}/imports",
        tags: ["Imports"],
      })
      .input(
        base.extend({
          token: z.string().min(1),
          key: z.string().min(1),
          fileType: z.string().min(1),
          fileSize: z.number().int().positive(),
          fileName: z.string().min(1),
        })
      )
      .output(z.object({ id: z.string(), job: importDto }))
      .handler(({ context, input }) =>
        createImport(
          context,
          context.workspaceId,
          context.session.user.id,
          context.role,
          input
        )
      ),
  },
};
