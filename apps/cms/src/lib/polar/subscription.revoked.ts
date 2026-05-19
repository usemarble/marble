"use server";

import { db } from "@marble/db";
import { SubscriptionStatus } from "@marble/db/browser";
import type { WebhookSubscriptionRevokedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionrevokedpayload.js";
import { isStalePolarEvent } from "./utils";

export async function handleSubscriptionRevoked(
  payload: WebhookSubscriptionRevokedPayload
) {
  const { data: subscription } = payload;

  const existingSubscription = await db.subscription.findUnique({
    where: { polarId: subscription.id },
  });

  if (!existingSubscription) {
    console.error(
      `subscription.revoked webhook received for a subscription that does not exist: ${subscription.id}`
    );
    return;
  }

  if (
    isStalePolarEvent(existingSubscription.lastPolarEventAt, payload.timestamp)
  ) {
    console.log(
      `Ignoring stale subscription.revoked webhook for subscription ${subscription.id}`
    );
    return;
  }

  try {
    const result = await db.subscription.updateMany({
      where: {
        polarId: subscription.id,
        OR: [
          { lastPolarEventAt: null },
          { lastPolarEventAt: { lte: payload.timestamp } },
        ],
      },
      data: {
        status: SubscriptionStatus.expired,
        endedAt: subscription.endedAt
          ? new Date(subscription.endedAt)
          : new Date(),
        lastPolarEventAt: payload.timestamp,
      },
    });

    if (result.count === 0) {
      console.log(
        `Ignoring stale subscription.revoked webhook for subscription ${subscription.id}`
      );
      return;
    }

    console.log(
      `Successfully marked subscription ${subscription.id} as revoked/expired for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    console.error("Error updating subscription to revoked in DB:", error);
  }
}
