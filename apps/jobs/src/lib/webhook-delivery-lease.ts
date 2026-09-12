import { webhookDelivery } from "@marble/db/schema";
import { and, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { WEBHOOK_DELIVERY_LEASE_MS } from "./constants";
import type { DbClient } from "./db";

type WebhookDeliveryUpdateData = Partial<
  Pick<
    typeof webhookDelivery.$inferInsert,
    "status" | "failedAt" | "deliveredAt" | "lastAttemptAt"
  >
>;

export interface WebhookDeliveryLease {
  deliveryId: string;
  attemptNumber: number;
  claimedAt: Date;
}

export function webhookDeliveryLeaseWhere(lease: WebhookDeliveryLease) {
  return and(
    eq(webhookDelivery.id, lease.deliveryId),
    eq(webhookDelivery.status, "sending"),
    eq(webhookDelivery.attemptCount, lease.attemptNumber),
    eq(webhookDelivery.lastAttemptAt, lease.claimedAt)
  );
}

export async function claimWebhookDeliveryAttempt(
  db: DbClient,
  deliveryId: string,
  now = new Date()
): Promise<WebhookDeliveryLease | null> {
  const staleBefore = new Date(now.getTime() - WEBHOOK_DELIVERY_LEASE_MS);

  const claimableWhere = and(
    eq(webhookDelivery.id, deliveryId),
    sql`${webhookDelivery.attemptCount} < ${webhookDelivery.maxAttempts}`,
    or(
      inArray(webhookDelivery.status, ["pending", "retrying"]),
      and(
        eq(webhookDelivery.status, "sending"),
        or(
          isNull(webhookDelivery.lastAttemptAt),
          lte(webhookDelivery.lastAttemptAt, staleBefore)
        )
      )
    )
  );

  const claimed = await db
    .update(webhookDelivery)
    .set({
      status: "sending",
      attemptCount: sql`${webhookDelivery.attemptCount} + 1`,
      lastAttemptAt: now,
    })
    .where(claimableWhere)
    .returning({
      id: webhookDelivery.id,
      attemptCount: webhookDelivery.attemptCount,
      lastAttemptAt: webhookDelivery.lastAttemptAt,
    });

  const delivery = claimed[0];
  if (delivery) {
    if (!delivery.lastAttemptAt) {
      throw new Error(`Claimed webhook delivery ${deliveryId} without a lease`);
    }

    return {
      deliveryId: delivery.id,
      attemptNumber: delivery.attemptCount,
      claimedAt: delivery.lastAttemptAt,
    };
  }

  const exhaustedWhere = and(
    eq(webhookDelivery.id, deliveryId),
    sql`${webhookDelivery.attemptCount} >= ${webhookDelivery.maxAttempts}`,
    or(
      inArray(webhookDelivery.status, ["pending", "retrying"]),
      and(
        eq(webhookDelivery.status, "sending"),
        or(
          isNull(webhookDelivery.lastAttemptAt),
          lte(webhookDelivery.lastAttemptAt, staleBefore)
        )
      )
    )
  );

  const exhausted = await db
    .update(webhookDelivery)
    .set({
      status: "failed",
      failedAt: now,
    })
    .where(exhaustedWhere)
    .returning({ id: webhookDelivery.id });

  if (exhausted.length > 0) {
    return null;
  }

  const existing = await db.query.webhookDelivery.findFirst({
    where: eq(webhookDelivery.id, deliveryId),
    columns: { status: true },
  });

  if (existing?.status === "sending") {
    throw new Error(
      `Webhook delivery ${deliveryId} is already being processed`
    );
  }

  return null;
}

export async function renewWebhookDeliveryLease(
  db: DbClient,
  lease: WebhookDeliveryLease,
  now = new Date()
): Promise<WebhookDeliveryLease | null> {
  const renewed = await db
    .update(webhookDelivery)
    .set({ lastAttemptAt: now })
    .where(webhookDeliveryLeaseWhere(lease))
    .returning({ lastAttemptAt: webhookDelivery.lastAttemptAt });

  const delivery = renewed[0];
  if (!delivery?.lastAttemptAt) {
    return null;
  }

  return { ...lease, claimedAt: delivery.lastAttemptAt };
}

export async function updateWebhookDeliveryForLease(
  db: DbClient,
  lease: WebhookDeliveryLease,
  data: WebhookDeliveryUpdateData
) {
  const updated = await db
    .update(webhookDelivery)
    .set(data)
    .where(webhookDeliveryLeaseWhere(lease))
    .returning({ id: webhookDelivery.id });

  return { count: updated.length };
}
