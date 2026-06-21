import { createDbClient } from "../lib/db";
import type { Env } from "../types/env";
import { cleanupOldWebhookDeliveries } from "./deliveries";
import { cleanupExpiredExports } from "./exports";

export async function handleCleanup(
  _event: ScheduledEvent,
  env: Env,
  _ctx: ExecutionContext
) {
  console.log(
    `[Cleanup] Running scheduled cleanup at ${new Date().toISOString()}`
  );

  const db = createDbClient(env);
  const now = new Date();

  const results = await Promise.allSettled([
    cleanupExpiredExports({ db, env, now }),
    cleanupOldWebhookDeliveries({ db, now }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[Cleanup] Task failed:", result.reason);
    }
  }
}
