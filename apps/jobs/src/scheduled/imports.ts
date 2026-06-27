import {
  IMPORT_JOB_RETENTION_DAYS,
  IMPORT_STALE_JOB_DAYS,
  MILLISECONDS_IN_DAY,
} from "@/lib/constants";
import type { DbClient } from "@/lib/db";
import type { Env } from "@/types/env";

const IMPORT_CLEANUP_BATCH_SIZE = 100;

async function deleteImportUpload({
  env,
  id,
  uploadKey,
}: {
  env: Env;
  id: string;
  uploadKey: string | null;
}) {
  if (!uploadKey) {
    return true;
  }

  try {
    await env.STORAGE.delete(uploadKey);
    return true;
  } catch (error) {
    console.error(`[Cleanup] Failed to delete import upload ${id}:`, error);
    return false;
  }
}

export async function cleanupStaleImports({
  db,
  env,
  now,
}: {
  db: DbClient;
  env: Env;
  now: Date;
}) {
  const staleCutoff = new Date(
    now.getTime() - IMPORT_STALE_JOB_DAYS * MILLISECONDS_IN_DAY
  );
  const retentionCutoff = new Date(
    now.getTime() - IMPORT_JOB_RETENTION_DAYS * MILLISECONDS_IN_DAY
  );

  const staleJobs = await db.importJob.findMany({
    where: {
      createdAt: { lt: staleCutoff },
      status: { in: ["queued", "discovering", "processing", "importing"] },
    },
    select: {
      id: true,
      uploadKey: true,
    },
    take: IMPORT_CLEANUP_BATCH_SIZE,
  });

  let staleCount = 0;

  for (const job of staleJobs) {
    const uploadDeleted = await deleteImportUpload({
      env,
      id: job.id,
      uploadKey: job.uploadKey,
    });

    if (!uploadDeleted) {
      continue;
    }

    await db.importJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        failedAt: now,
        errorMessage: "Import timed out before it could complete",
        uploadKey: null,
      },
    });
    staleCount += 1;
  }

  const oldJobs = await db.importJob.findMany({
    where: {
      createdAt: { lt: retentionCutoff },
      status: { in: ["completed", "failed"] },
    },
    select: {
      id: true,
      uploadKey: true,
    },
    take: IMPORT_CLEANUP_BATCH_SIZE,
  });

  let deletedCount = 0;

  for (const job of oldJobs) {
    const uploadDeleted = await deleteImportUpload({
      env,
      id: job.id,
      uploadKey: job.uploadKey,
    });

    if (!uploadDeleted) {
      continue;
    }

    await db.importJob.delete({
      where: { id: job.id },
    });
    deletedCount += 1;
  }

  if (staleCount > 0) {
    console.log(`[Cleanup] Marked ${staleCount} stale import job(s) failed`);
  }

  if (deletedCount > 0) {
    console.log(`[Cleanup] Deleted ${deletedCount} old import job(s)`);
  }
}
