import type { DbClient } from "../lib/db";
import type { Env } from "../types/env";

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
    const expiredExports = await db.exportJob.findMany({
      where: {
        status: "ready",
        expiresAt: { lte: now },
      },
      select: {
        id: true,
        storageKey: true,
      },
      take: 50,
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

      await db.exportJob.update({
        where: { id: job.id },
        data: {
          status: "expired",
          downloadTokenHash: null,
        },
      });
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
