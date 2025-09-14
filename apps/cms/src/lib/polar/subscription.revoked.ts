"use server";

import { db } from "@marble/db";
import { SubscriptionStatus } from "@marble/db/client";
import type { WebhookSubscriptionRevokedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionrevokedpayload.js";

export async function handleSubscriptionRevoked(
  payload: WebhookSubscriptionRevokedPayload,
) {
  const { data: subscription } = payload;

  const existingSubscription = await db.subscription.findUnique({
    where: { polarId: subscription.id },
  });

  if (!existingSubscription) {
    console.error(
      `subscription.revoked webhook received for a subscription that does not exist: ${subscription.id}`,
    );
    return;
  }

  try {
    await db.subscription.update({
      where: { polarId: subscription.id },
      data: {
        status: SubscriptionStatus.expired,
        endedAt: subscription.endedAt
          ? new Date(subscription.endedAt)
          : new Date(),
      },
    });

    console.log(
      `Successfully marked subscription ${subscription.id} as revoked/expired for workspace ${existingSubscription.workspaceId}`,
    );
  } catch (error) {
    console.error("Error updating subscription to revoked in DB:", error);
  }
}
