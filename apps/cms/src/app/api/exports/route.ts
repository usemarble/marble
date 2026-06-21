import { db } from "@marble/db";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { enqueueTask } from "@/lib/tasks/dispatch";

const DEFAULT_EXPORT_SCOPE = {
  schemaVersion: 1,
  resources: ["posts", "categories", "tags", "authors", "media", "fields"],
  includeMediaFiles: false,
  postStatuses: ["draft", "published"],
} as const;

function serializeExportJob(job: {
  id: string;
  status: string;
  format: string;
  fileSize: number | null;
  expiresAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  failedAt: Date | null;
  errorMessage: string | null;
}) {
  return {
    id: job.id,
    status: job.status,
    format: job.format,
    fileSize: job.fileSize,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
    failedAt: job.failedAt?.toISOString() ?? null,
    errorMessage: job.errorMessage,
  };
}

export async function GET() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const jobs = await db.exportJob.findMany({
    where: {
      workspaceId: accessData.workspaceId,
      status: { not: "expired" },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      format: true,
      fileSize: true,
      expiresAt: true,
      createdAt: true,
      completedAt: true,
      failedAt: true,
      errorMessage: true,
    },
  });

  return NextResponse.json({ jobs: jobs.map(serializeExportJob) });
}

export async function POST() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;

  const job = await db.exportJob.create({
    data: {
      workspaceId,
      createdById: sessionData.user.id,
      format: "json",
      scope: DEFAULT_EXPORT_SCOPE,
    },
    select: {
      id: true,
      status: true,
      format: true,
      fileSize: true,
      expiresAt: true,
      createdAt: true,
      completedAt: true,
      failedAt: true,
      errorMessage: true,
    },
  });

  try {
    await enqueueTask({ type: "export.process", jobId: job.id });
  } catch (error) {
    await db.exportJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        failedAt: new Date(),
        errorMessage:
          error instanceof Error ? error.message : "Failed to enqueue export",
      },
    });

    return NextResponse.json(
      { error: "Failed to start export" },
      { status: 500 }
    );
  }

  return NextResponse.json({ job: serializeExportJob(job) }, { status: 201 });
}
