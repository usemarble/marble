import type { Env } from "../types/env";
import type { DbClient } from "./db";

/**
 * Phase 1 of an import: parse/discover source content into ImportItem rows for
 * the user to review. Ends with the job in "review". Idempotent: starts from a
 * fresh ("queued") job and keeps retrying if the queue redelivers while the job
 * is already "processing".
 */
export async function runImportProcess(db: DbClient, _env: Env, jobId: string) {
  const job = await db.importJob.findUnique({ where: { id: jobId } });

  if (!job) {
    console.error(`[Import] Job not found: ${jobId}`);
    return;
  }

  if (job.status !== "queued" && job.status !== "processing") {
    return;
  }

  if (job.status === "queued") {
    await db.importJob.update({
      where: { id: job.id },
      data: { status: "processing", startedAt: job.startedAt ?? new Date() },
    });
  }

  // TODO(import:process):
  //   - source = file: fetch job.uploadKey from env.STORAGE, parse entries.
  //   - source = url:  (later) discover feed/sitemap/API or crawl.
  //   - Upsert one ImportItem per discovered post (raw* fields, status ready
  //     or needs_review), update counters, then set job status = "review".
  throw new Error("Import process phase not implemented");
}

/**
 * Phase 2 of an import: after the user confirms the review, turn ready
 * ImportItems into draft posts. Idempotent: skips items already imported.
 */
export async function runImportCreate(db: DbClient, _env: Env, jobId: string) {
  const job = await db.importJob.findUnique({ where: { id: jobId } });

  if (!job) {
    console.error(`[Import] Job not found: ${jobId}`);
    return;
  }

  if (job.status !== "review" && job.status !== "importing") {
    return;
  }

  await db.importJob.update({
    where: { id: job.id },
    data: { status: "importing" },
  });

  // TODO(import:create):
  //   - Apply job.mapping to resolve categories/tags/authors.
  //   - Create a draft Post per ready ImportItem, set ImportItem.postId +
  //     status "imported" (skip already-imported items for idempotency).
  //   - Update counters; set job status = "completed" + completedAt.
  throw new Error("Import create phase not implemented");
}
