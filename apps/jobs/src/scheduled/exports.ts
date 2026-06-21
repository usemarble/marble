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
  }

  if (expiredExports.length > 0) {
    console.log(`[Cleanup] Expired ${expiredExports.length} export(s)`);
  }
}
