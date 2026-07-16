import { WEBHOOK_DELIVERY_LEASE_MS } from "./constants";
import type { DbClient } from "./db";

type WebhookDeliveryDelegate = DbClient["webhookDelivery"];
interface WebhookDeliveryLeaseDb {
  webhookDelivery: Pick<
    WebhookDeliveryDelegate,
    "findUnique" | "updateMany" | "updateManyAndReturn"
  > & {
    fields: Pick<WebhookDeliveryDelegate["fields"], "maxAttempts">;
  };
}
type WebhookDeliveryUpdateData = Parameters<
  DbClient["webhookDelivery"]["updateMany"]
>[0]["data"];

export interface WebhookDeliveryLease {
  deliveryId: string;
  attemptNumber: number;
  claimedAt: Date;
}

export function webhookDeliveryLeaseWhere(lease: WebhookDeliveryLease) {
  return {
    id: lease.deliveryId,
    status: "sending" as const,
    attemptCount: lease.attemptNumber,
    lastAttemptAt: lease.claimedAt,
  };
}

export async function claimWebhookDeliveryAttempt(
  db: WebhookDeliveryLeaseDb,
  deliveryId: string,
  now = new Date()
): Promise<WebhookDeliveryLease | null> {
  const staleBefore = new Date(now.getTime() - WEBHOOK_DELIVERY_LEASE_MS);
  const maxAttempts = db.webhookDelivery.fields.maxAttempts;

  const claimed = await db.webhookDelivery.updateManyAndReturn({
    where: {
      id: deliveryId,
      attemptCount: { lt: maxAttempts },
      OR: [
        { status: { in: ["pending", "retrying"] } },
        {
          status: "sending",
          OR: [
            { lastAttemptAt: null },
            { lastAttemptAt: { lte: staleBefore } },
          ],
        },
      ],
    },
    data: {
      status: "sending",
      attemptCount: { increment: 1 },
      lastAttemptAt: now,
    },
    select: {
      id: true,
      attemptCount: true,
      lastAttemptAt: true,
    },
    limit: 1,
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

  // A delivery can exhaust its attempts while a worker is unavailable. Mark
  // only recoverable states as failed; terminal deliveries remain untouched.
  const exhausted = await db.webhookDelivery.updateMany({
    where: {
      id: deliveryId,
      attemptCount: { gte: maxAttempts },
      OR: [
        { status: { in: ["pending", "retrying"] } },
        {
          status: "sending",
          OR: [
            { lastAttemptAt: null },
            { lastAttemptAt: { lte: staleBefore } },
          ],
        },
      ],
    },
    data: {
      status: "failed",
      failedAt: now,
    },
  });

  if (exhausted.count > 0) {
    return null;
  }

  const existing = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    select: { status: true },
  });

  if (existing?.status === "sending") {
    throw new Error(
      `Webhook delivery ${deliveryId} is already being processed`
    );
  }

  return null;
}

export async function renewWebhookDeliveryLease(
  db: WebhookDeliveryLeaseDb,
  lease: WebhookDeliveryLease,
  now = new Date()
): Promise<WebhookDeliveryLease | null> {
  const renewed = await db.webhookDelivery.updateManyAndReturn({
    where: webhookDeliveryLeaseWhere(lease),
    data: { lastAttemptAt: now },
    select: { lastAttemptAt: true },
    limit: 1,
  });

  const delivery = renewed[0];
  if (!delivery?.lastAttemptAt) {
    return null;
  }

  return { ...lease, claimedAt: delivery.lastAttemptAt };
}

export async function updateWebhookDeliveryForLease(
  db: WebhookDeliveryLeaseDb,
  lease: WebhookDeliveryLease,
  data: WebhookDeliveryUpdateData
) {
  return db.webhookDelivery.updateMany({
    where: webhookDeliveryLeaseWhere(lease),
    data,
  });
}
