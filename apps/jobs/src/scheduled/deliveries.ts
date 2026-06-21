import {
  MILLISECONDS_IN_DAY,
  WEBHOOK_DELIVERY_RETENTION_DAYS,
} from "@/lib/constants";
import type { DbClient } from "@/lib/db";

export async function cleanupOldWebhookDeliveries({
  db,
  now,
}: {
  db: DbClient;
  now: Date;
}) {
  const cutoff = new Date(
    now.getTime() - WEBHOOK_DELIVERY_RETENTION_DAYS * MILLISECONDS_IN_DAY
  );

  const result = await db.webhookDelivery.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      status: { in: ["success", "failed"] },
    },
  });

  if (result.count > 0) {
    console.log(
      `[Cleanup] Deleted ${result.count} old webhook delivery row(s)`
    );
  }
}
