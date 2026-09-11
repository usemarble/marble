import { importJob } from "@marble/drizzle/schema";
import { and, eq, inArray, lt } from "drizzle-orm";
import {
  IMPORT_JOB_RETENTION_DAYS,
  IMPORT_STALE_JOB_DAYS,
  MILLISECONDS_IN_DAY,
} from "@/lib/constants";
import type { DbClient } from "@/lib/db";
import type { Env } from "@/types/env";

const IMPORT_CLEANUP_BATCH_SIZE = 100;
type ActiveImportStatus = "queued" | "discovering" | "processing" | "importing";

const ACTIVE_IMPORT_STATUSES: ActiveImportStatus[] = [
  "queued",
  "discovering",
  "processing",
  "importing",
];

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

  const staleJobs = await db.query.importJob.findMany({
    where: and(
      lt(importJob.createdAt, staleCutoff),
      inArray(importJob.status, ACTIVE_IMPORT_STATUSES)
    ),
    columns: {
      id: true,
      uploadKey: true,
    },
    limit: IMPORT_CLEANUP_BATCH_SIZE,
  });

  let staleCount = 0;

  for (const job of staleJobs) {
    const staleUpdate = await db
      .update(importJob)
      .set({
        status: "failed",
        failedAt: now,
        errorMessage: "Import timed out before it could complete",
      })
      .where(
        and(
          eq(importJob.id, job.id),
          lt(importJob.createdAt, staleCutoff),
          inArray(importJob.status, ACTIVE_IMPORT_STATUSES)
        )
      )
      .returning({ id: importJob.id });

    if (staleUpdate.length === 0) {
      continue;
    }

    staleCount += 1;

    const uploadDeleted = await deleteImportUpload({
      env,
      id: job.id,
      uploadKey: job.uploadKey,
    });

    if (!uploadDeleted) {
      continue;
    }

    await db
      .update(importJob)
      .set({ uploadKey: null })
      .where(eq(importJob.id, job.id));
  }

  const oldJobs = await db.query.importJob.findMany({
    where: and(
      lt(importJob.createdAt, retentionCutoff),
      inArray(importJob.status, ["completed", "failed"])
    ),
    columns: {
      id: true,
      uploadKey: true,
    },
    limit: IMPORT_CLEANUP_BATCH_SIZE,
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

    await db.delete(importJob).where(eq(importJob.id, job.id));
    deletedCount += 1;
  }

  if (staleCount > 0) {
    console.log(`[Cleanup] Marked ${staleCount} stale import job(s) failed`);
  }

  if (deletedCount > 0) {
    console.log(`[Cleanup] Deleted ${deletedCount} old import job(s)`);
  }
}
