import { closeDbClient, createDbClient } from "@/lib/db";
import { cleanupStaleApiRequests } from "@/scheduled/api-requests";
import { cleanupOldWebhookDeliveries } from "@/scheduled/deliveries";
import { cleanupExpiredExports } from "@/scheduled/exports";
import { cleanupStaleImports } from "@/scheduled/imports";

export async function handleCleanup() {
  console.log(
    `[Cleanup] Running scheduled cleanup at ${new Date().toISOString()}`
  );

  const db = await createDbClient();
  try {
    const now = new Date();

    const results = await Promise.allSettled([
      cleanupExpiredExports({ db, now }),
      cleanupStaleImports({ db, now }),
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
