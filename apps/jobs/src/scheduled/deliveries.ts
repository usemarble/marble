import type { DbClient } from "../lib/db";

const WEBHOOK_DELIVERY_RETENTION_DAYS = 30;

export async function cleanupOldWebhookDeliveries({
  db,
  now,
}: {
  db: DbClient;
  now: Date;
}) {
  const cutoff = new Date(
    now.getTime() - WEBHOOK_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000
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
