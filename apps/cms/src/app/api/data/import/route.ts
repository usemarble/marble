import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@marble/db";
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

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const jobs = await db.importJob.findMany({
    where: {
      workspaceId: accessData.workspaceId,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      source: true,
      status: true,
      format: true,
      sourceUrl: true,
      totalItems: true,
      readyItems: true,
      errorItems: true,
      importedItems: true,
      startedAt: true,
      completedAt: true,
      failedAt: true,
      errorMessage: true,
      createdAt: true,
    },
  });

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
    job = await db.importJob.create({
      data: {
        workspaceId,
        createdById: sessionData.user.id,
        ...jobData,
      },
      select: {
        id: true,
        source: true,
        status: true,
        format: true,
        sourceUrl: true,
        totalItems: true,
        readyItems: true,
        errorItems: true,
        importedItems: true,
        startedAt: true,
        completedAt: true,
        failedAt: true,
        errorMessage: true,
        createdAt: true,
      },
    });
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
    await db.importJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        errorMessage:
          error instanceof Error ? error.message : "Failed to enqueue import",
      },
    });

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
