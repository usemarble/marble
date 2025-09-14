"use server";

import { db } from "@marble/db";
import type { WebhookSubscriptionCanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncanceledpayload.js";
import { SubscriptionStatus } from "@marble/db/client";

export async function handleSubscriptionCanceled(
  payload: WebhookSubscriptionCanceledPayload,
) {
  const { data: subscription } = payload;

  const existingSubscription = await db.subscription.findUnique({
    where: { polarId: subscription.id },
  });

  if (!existingSubscription) {
    console.error(
      `subscription.canceled webhook received for a subscription that does not exist: ${subscription.id}`,
    );
    return;
  }

  try {
    await db.subscription.update({
      where: { polarId: subscription.id },
      data: {
        status: SubscriptionStatus.cancelled,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt
          ? new Date(subscription.canceledAt)
          : new Date(),
        endsAt: subscription.endsAt ? new Date(subscription.endsAt) : null,
      },
    });

    console.log(
      `Successfully marked subscription ${subscription.id} as canceled for workspace ${existingSubscription.workspaceId}`,
    );
  } catch (error) {
    console.error("Error updating subscription to canceled in DB:", error);
  }
}
