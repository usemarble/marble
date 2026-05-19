"use server";

import { db } from "@marble/db";
import { SubscriptionStatus } from "@marble/db/browser";
import type { WebhookSubscriptionCanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncanceledpayload.js";
import { isStalePolarEvent } from "./utils";

export async function handleSubscriptionCanceled(
  payload: WebhookSubscriptionCanceledPayload
) {
  const { data: subscription } = payload;

  const existingSubscription = await db.subscription.findUnique({
    where: { polarId: subscription.id },
  });

  if (!existingSubscription) {
    console.error(
      `subscription.canceled webhook received for a subscription that does not exist: ${subscription.id}`
    );
    return;
  }

  if (
    isStalePolarEvent(existingSubscription.lastPolarEventAt, payload.timestamp)
  ) {
    console.log(
      `Ignoring stale subscription.canceled webhook for subscription ${subscription.id}`
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
        status: SubscriptionStatus.canceled,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt
          ? new Date(subscription.canceledAt)
          : new Date(),
        endsAt: subscription.endsAt ? new Date(subscription.endsAt) : null,
        lastPolarEventAt: payload.timestamp,
      },
    });

    if (result.count === 0) {
      console.log(
        `Ignoring stale subscription.canceled webhook for subscription ${subscription.id}`
      );
      return;
    }

    console.log(
      `Successfully marked subscription ${subscription.id} as canceled for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    console.error("Error updating subscription to canceled in DB:", error);
  }
}
