import { createRecordId } from "@marble/db/id";
import { exportJob, importJob, workspace } from "@marble/db/schema";
import { AwsClient } from "aws4fetch";
import { and, desc, eq, ne } from "drizzle-orm";
import type { ServiceContext } from "../context";
import { transact } from "../lib/transaction";
import { completeUpload } from "./uploads";

export class DataTransferError extends Error {
  status: 400 | 403 | 404 | 410 | 500;
  constructor(status: 400 | 403 | 404 | 410 | 500, message: string) {
    super(message);
    this.status = status;
  }
}

const exportScope = {
  schemaVersion: 1,
  resources: ["posts", "categories", "tags", "authors", "media", "fields"],
  includeMediaFiles: false,
  postStatuses: ["draft", "published"],
};
const exportColumns = {
  id: exportJob.id,
  status: exportJob.status,
  format: exportJob.format,
  fileSize: exportJob.fileSize,
  expiresAt: exportJob.expiresAt,
  createdAt: exportJob.createdAt,
  completedAt: exportJob.completedAt,
  failedAt: exportJob.failedAt,
  errorMessage: exportJob.errorMessage,
};
const importColumns = {
  id: importJob.id,
  source: importJob.source,
  status: importJob.status,
  format: importJob.format,
  sourceUrl: importJob.sourceUrl,
  totalItems: importJob.totalItems,
  readyItems: importJob.readyItems,
  errorItems: importJob.errorItems,
  importedItems: importJob.importedItems,
  startedAt: importJob.startedAt,
  completedAt: importJob.completedAt,
  failedAt: importJob.failedAt,
  errorMessage: importJob.errorMessage,
  createdAt: importJob.createdAt,
};

type ExportRow = Pick<
  typeof exportJob.$inferSelect,
  | "id"
  | "status"
  | "format"
  | "fileSize"
  | "expiresAt"
  | "createdAt"
  | "completedAt"
  | "failedAt"
  | "errorMessage"
>;
type ImportRow = Pick<
  typeof importJob.$inferSelect,
  | "id"
  | "source"
  | "status"
  | "format"
  | "sourceUrl"
  | "totalItems"
  | "readyItems"
  | "errorItems"
  | "importedItems"
  | "startedAt"
  | "completedAt"
  | "failedAt"
  | "errorMessage"
  | "createdAt"
>;
function exportDto(row: ExportRow) {
  return {
    ...row,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
  };
}
function importDto(row: ImportRow) {
  return {
    ...row,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    failedAt: row.failedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listExports(ctx: ServiceContext, workspaceId: string) {
  const rows = await ctx.db
    .select(exportColumns)
    .from(exportJob)
    .where(
      and(
        eq(exportJob.workspaceId, workspaceId),
        ne(exportJob.status, "expired")
      )
    )
    .orderBy(desc(exportJob.createdAt))
    .limit(10);
  return { jobs: rows.map(exportDto) };
}
export async function createExport(
  ctx: ServiceContext,
  workspaceId: string,
  actorId: string
) {
  const [job] = await transact(ctx, async ({ tx }) =>
    tx
      .insert(exportJob)
      .values({
        id: createRecordId(),
        workspaceId,
        createdById: actorId,
        format: "json",
        scope: exportScope,
        updatedAt: new Date(),
      })
      .returning(exportColumns)
  );
  if (!job) {
    throw new DataTransferError(500, "Failed to create export job");
  }
  try {
    await ctx.queues.tasks.send({ type: "export.process", jobId: job.id });
  } catch (error) {
    await transact(ctx, async ({ tx }) =>
      tx
        .update(exportJob)
        .set({
          status: "failed",
          failedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : "Failed to enqueue export",
          updatedAt: new Date(),
        })
        .where(
          and(eq(exportJob.id, job.id), eq(exportJob.workspaceId, workspaceId))
        )
    );
    throw new DataTransferError(500, "Failed to start export");
  }
  return { job: exportDto(job) };
}

const exportDownloadColumns = {
  status: exportJob.status,
  storageKey: exportJob.storageKey,
  expiresAt: exportJob.expiresAt,
  createdAt: exportJob.createdAt,
  downloadTokenHash: exportJob.downloadTokenHash,
  slug: workspace.slug,
};

interface ExportDownloadRow {
  status: string;
  storageKey: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  slug: string;
}

/**
 * Signs a five-minute R2 GET for a ready export, so the file downloads from
 * R2 directly instead of streaming through the Worker.
 */
async function presignExport(
  ctx: Pick<ServiceContext, "env">,
  job: ExportDownloadRow
) {
  if (job.status !== "ready" || !job.storageKey) {
    throw new DataTransferError(404, "Export not found");
  }
  if (job.expiresAt && job.expiresAt <= new Date()) {
    throw new DataTransferError(410, "Export expired");
  }
  const object = await ctx.env.STORAGE.head(job.storageKey);
  if (!object) {
    throw new DataTransferError(404, "Export file missing");
  }
  const signer = new AwsClient({
    accessKeyId: ctx.env.R2_ACCESS_KEY_ID,
    secretAccessKey: ctx.env.R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  const url = new URL(
    `${ctx.env.R2_S3_ENDPOINT}/${ctx.env.R2_BUCKET_NAME}/${job.storageKey}`
  );
  url.searchParams.set("X-Amz-Expires", "300");
  url.searchParams.set(
    "response-content-disposition",
    `attachment; filename="marble-${job.slug}-export-${job.createdAt.toISOString().slice(0, 10)}.zip"`
  );
  const request = await signer.sign(url.toString(), {
    method: "GET",
    aws: { signQuery: true },
  });
  return { url: request.url };
}

/** A member downloading an export from the dashboard. */
export async function getExportDownload(
  ctx: ServiceContext,
  workspaceId: string,
  id: string
) {
  const [job] = await ctx.db
    .select(exportDownloadColumns)
    .from(exportJob)
    .innerJoin(workspace, eq(workspace.id, exportJob.workspaceId))
    .where(and(eq(exportJob.id, id), eq(exportJob.workspaceId, workspaceId)))
    .limit(1);
  if (!job) {
    throw new DataTransferError(404, "Export not found");
  }
  return await presignExport(ctx, job);
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

/**
 * The link in the export-ready email. It works without a session (the email
 * may be opened anywhere), so the job's one-off token is the credential: only
 * its SHA-256 is stored, and the export's expiry bounds it.
 */
export async function getExportDownloadByToken(
  ctx: Pick<ServiceContext, "db" | "env">,
  id: string,
  token: string
) {
  const [job] = await ctx.db
    .select(exportDownloadColumns)
    .from(exportJob)
    .innerJoin(workspace, eq(workspace.id, exportJob.workspaceId))
    .where(eq(exportJob.id, id))
    .limit(1);
  if (!job) {
    throw new DataTransferError(404, "Export not found");
  }
  if (
    !job.downloadTokenHash ||
    (await sha256Hex(token)) !== job.downloadTokenHash
  ) {
    throw new DataTransferError(403, "Invalid download token");
  }
  return await presignExport(ctx, job);
}

export async function listImports(ctx: ServiceContext, workspaceId: string) {
  const rows = await ctx.db
    .select(importColumns)
    .from(importJob)
    .where(eq(importJob.workspaceId, workspaceId))
    .orderBy(desc(importJob.createdAt))
    .limit(10);
  return { jobs: rows.map(importDto) };
}
export async function createImport(
  ctx: ServiceContext,
  workspaceId: string,
  actorId: string,
  role: string,
  input: {
    token: string;
    key: string;
    fileType: string;
    fileSize: number;
    fileName: string;
  }
) {
  await completeUpload(ctx, { id: actorId }, workspaceId, role, {
    ...input,
    type: "import",
  });
  const extension = input.fileName.toLowerCase().split(".").pop();
  if (
    !["md", "mdx", "zip"].includes(extension ?? "") ||
    !input.key.endsWith(`.${extension}`)
  ) {
    throw new DataTransferError(
      400,
      "Import file must be a .md, .mdx, or .zip file"
    );
  }
  const [job] = await transact(ctx, async ({ tx }) =>
    tx
      .insert(importJob)
      .values({
        id: createRecordId(),
        workspaceId,
        createdById: actorId,
        source: "file",
        format: "markdown",
        uploadKey: input.key,
        updatedAt: new Date(),
      })
      .returning(importColumns)
  );
  if (!job) {
    throw new DataTransferError(500, "Failed to create import job");
  }
  try {
    await ctx.queues.tasks.send({ type: "import.process", jobId: job.id });
  } catch (error) {
    await transact(ctx, async ({ tx }) =>
      tx
        .update(importJob)
        .set({
          status: "failed",
          failedAt: new Date(),
          errorMessage:
            error instanceof Error ? error.message : "Failed to enqueue import",
          updatedAt: new Date(),
        })
        .where(
          and(eq(importJob.id, job.id), eq(importJob.workspaceId, workspaceId))
        )
    );
    throw new DataTransferError(500, "Failed to start import");
  }
  return { id: job.id, job: importDto(job) };
}
