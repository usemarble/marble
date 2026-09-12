import { exportJob } from "@marble/db/schema";
import { and, eq, lte } from "drizzle-orm";
import type { DbClient } from "@/lib/db";
import type { Env } from "@/types/env";

export async function cleanupExpiredExports({
  db,
  env,
  now,
}: {
  db: DbClient;
  env: Env;
  now: Date;
}) {
  let expiredCount = 0;

  while (true) {
    const expiredExports = await db.query.exportJob.findMany({
      where: and(eq(exportJob.status, "ready"), lte(exportJob.expiresAt, now)),
      columns: {
        id: true,
        storageKey: true,
      },
      limit: 50,
    });

    if (expiredExports.length === 0) {
      break;
    }

    for (const job of expiredExports) {
      if (job.storageKey) {
        try {
          await env.STORAGE.delete(job.storageKey);
        } catch (error) {
          console.error(`[Cleanup] Failed to delete export ${job.id}:`, error);
          continue;
        }
      }

      await db
        .update(exportJob)
        .set({
          status: "expired",
          downloadTokenHash: null,
        })
        .where(eq(exportJob.id, job.id));
      expiredCount += 1;
    }

    if (expiredExports.length < 50) {
      break;
    }
  }

  if (expiredCount > 0) {
    console.log(`[Cleanup] Expired ${expiredCount} export(s)`);
  }
}
