import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/drizzle";
import { importJob } from "@marble/drizzle/schema";
import { createRecordId } from "@marble/drizzle/create-id";
import { desc, eq } from "@marble/drizzle/operators";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { enqueueTask } from "@/lib/queues/tasks";
import { R2_BUCKET_NAME, r2 } from "@/lib/r2";
import {
  getImportExtension,
  getImportFormat,
  getImportRequestSource,
  type ImportFormat,
  serializeImportJob,
} from "@/utils/import";

const importJobSelect = {
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
} as const;

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const jobs = await db
    .select(importJobSelect)
    .from(importJob)
    .where(eq(importJob.workspaceId, accessData.workspaceId))
    .orderBy(desc(importJob.createdAt))
    .limit(10);

  return NextResponse.json({ jobs: jobs.map(serializeImportJob) });
}

export async function POST(request: Request) {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;
  const importSource = await getImportRequestSource(request);

  if ("error" in importSource) {
    return NextResponse.json({ error: importSource.error }, { status: 400 });
  }

  if (importSource.source === "url") {
    return NextResponse.json(
      { error: "URL imports aren't supported yet" },
      { status: 400 }
    );
  }

  const { file } = importSource;
  const format = getImportFormat(file);

  if (!format) {
    return NextResponse.json(
      { error: "Import file must be a .md, .mdx, or .zip file" },
      { status: 400 }
    );
  }

  const extension = getImportExtension(file);
  const uploadKey = `imports/${workspaceId}/${crypto.randomUUID()}.${extension}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: uploadKey,
        Body: new Uint8Array(await file.arrayBuffer()),
        ContentLength: file.size,
        ContentType: file.type || "application/octet-stream",
      })
    );
  } catch (error) {
    console.error("[Imports] Failed to upload import file:", error);
    return NextResponse.json(
      { error: "Failed to upload import file" },
      { status: 500 }
    );
  }

  const jobData = {
    source: "file",
    format,
    uploadKey,
  } satisfies {
    source: "file";
    format: ImportFormat;
    uploadKey: string;
  };

  let job: Parameters<typeof serializeImportJob>[0];

  try {
    const [createdJob] = await db
      .insert(importJob)
      .values({
        id: createRecordId(),
        workspaceId,
        createdById: sessionData.user.id,
        updatedAt: new Date(),
        ...jobData,
      })
      .returning(importJobSelect);

    if (!createdJob) {
      throw new Error("Failed to create import job");
    }

    job = createdJob;
  } catch (error) {
    try {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: uploadKey,
        })
      );
    } catch (cleanupError) {
      console.error(
        `[Imports] Failed to delete orphaned import upload ${uploadKey}:`,
        cleanupError
      );
    }

    console.error("[Imports] Failed to create import job:", error);
    return NextResponse.json(
      { error: "Failed to create import job" },
      { status: 500 }
    );
  }

  try {
    await enqueueTask({ type: "import.process", jobId: job.id });
  } catch (error) {
    await db
      .update(importJob)
      .set({
        status: "failed",
        failedAt: new Date(),
        errorMessage:
          error instanceof Error ? error.message : "Failed to enqueue import",
        updatedAt: new Date(),
      })
      .where(eq(importJob.id, job.id));

    return NextResponse.json(
      { error: "Failed to start import" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { id: job.id, job: serializeImportJob(job) },
    { status: 201 }
  );
}
