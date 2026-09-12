import { closeDbClient, createDbClient } from "@/lib/db";
import { cleanupStaleApiRequests } from "@/scheduled/api-requests";
import { cleanupOldWebhookDeliveries } from "@/scheduled/deliveries";
import { cleanupExpiredExports } from "@/scheduled/exports";
import { cleanupStaleImports } from "@/scheduled/imports";
import type { Env } from "@/types/env";

export async function handleCleanup(
  _event: ScheduledEvent,
  env: Env,
  _ctx: ExecutionContext
) {
  console.log(
    `[Cleanup] Running scheduled cleanup at ${new Date().toISOString()}`
  );

  const db = await createDbClient(env);
  try {
    const now = new Date();

    const results = await Promise.allSettled([
      cleanupExpiredExports({ db, env, now }),
      cleanupStaleImports({ db, env, now }),
      cleanupOldWebhookDeliveries({ db, now }),
      cleanupStaleApiRequests({ db, now }),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[Cleanup] Task failed:", result.reason);
      }
    }
  } finally {
    await closeDbClient(db);
  }
}
