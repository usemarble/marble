import { webhookDelivery } from "@marble/drizzle/schema";
import { and, inArray, lt } from "drizzle-orm";
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

  const deleted = await db
    .delete(webhookDelivery)
    .where(
      and(
        lt(webhookDelivery.createdAt, cutoff),
        inArray(webhookDelivery.status, ["success", "failed"])
      )
    )
    .returning({ id: webhookDelivery.id });

  if (deleted.length > 0) {
    console.log(
      `[Cleanup] Deleted ${deleted.length} old webhook delivery row(s)`
    );
  }
}
