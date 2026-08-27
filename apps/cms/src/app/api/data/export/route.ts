import { db } from "@marble/drizzle";
import { exportJob } from "@marble/drizzle/schema";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireActiveWorkspaceAccess } from "@/lib/auth/access";
import { enqueueTask } from "@/lib/queues/tasks";

const DEFAULT_EXPORT_SCOPE = {
  schemaVersion: 1,
  resources: ["posts", "categories", "tags", "authors", "media", "fields"],
  includeMediaFiles: false,
  postStatuses: ["draft", "published"],
} as const;

const exportJobSelect = {
  id: exportJob.id,
  status: exportJob.status,
  format: exportJob.format,
  fileSize: exportJob.fileSize,
  expiresAt: exportJob.expiresAt,
  createdAt: exportJob.createdAt,
  completedAt: exportJob.completedAt,
  failedAt: exportJob.failedAt,
  errorMessage: exportJob.errorMessage,
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

  const jobs = await db
    .select(exportJobSelect)
    .from(exportJob)
    .where(
      and(
        eq(exportJob.workspaceId, accessData.workspaceId),
        ne(exportJob.status, "expired")
      )
    )
    .orderBy(desc(exportJob.createdAt))
    .limit(10);

  return NextResponse.json({ jobs: jobs.map(serializeExportJob) });
}

export async function POST() {
  const accessData = await requireActiveWorkspaceAccess();

  if (!accessData.ok) {
    return accessData.response;
  }

  const { sessionData, workspaceId } = accessData;
  const now = new Date();

  const [job] = await db
    .insert(exportJob)
    .values({
      id: createId(),
      workspaceId,
      createdById: sessionData.user.id,
      format: "json",
      scope: DEFAULT_EXPORT_SCOPE,
      updatedAt: now,
    })
    .returning(exportJobSelect);

  if (!job) {
    return NextResponse.json(
      { error: "Failed to create export job" },
      { status: 500 }
    );
  }

  try {
    await enqueueTask({ type: "export.process", jobId: job.id });
  } catch (error) {
    await db
      .update(exportJob)
      .set({
        status: "failed",
        failedAt: new Date(),
        errorMessage:
          error instanceof Error ? error.message : "Failed to enqueue export",
        updatedAt: new Date(),
      })
      .where(eq(exportJob.id, job.id));

    return NextResponse.json(
      { error: "Failed to start export" },
      { status: 500 }
    );
  }

  return NextResponse.json({ job: serializeExportJob(job) }, { status: 201 });
}
