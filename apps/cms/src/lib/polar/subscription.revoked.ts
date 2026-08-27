"use server";

import { db } from "@marble/drizzle";
import { subscription } from "@marble/drizzle/schema";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import type { WebhookSubscriptionRevokedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionrevokedpayload.js";
import { isStalePolarEvent } from "./utils";

export async function handleSubscriptionRevoked(
  payload: WebhookSubscriptionRevokedPayload
) {
  const { data: subscriptionData } = payload;

  const existingSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.polarId, subscriptionData.id),
  });

  if (!existingSubscription) {
    console.error(
      `subscription.revoked webhook received for a subscription that does not exist: ${subscriptionData.id}`
    );
    return;
  }

  if (
    isStalePolarEvent(existingSubscription.lastPolarEventAt, payload.timestamp)
  ) {
    console.log(
      `Ignoring stale subscription.revoked webhook for subscription ${subscriptionData.id}`
    );
    return;
  }

  try {
    const updated = await db
      .update(subscription)
      .set({
        status: "expired",
        endedAt: subscriptionData.endedAt
          ? new Date(subscriptionData.endedAt)
          : new Date(),
        lastPolarEventAt: payload.timestamp,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(subscription.polarId, subscriptionData.id),
          or(
            isNull(subscription.lastPolarEventAt),
            lte(subscription.lastPolarEventAt, payload.timestamp)
          )
        )
      )
      .returning({ id: subscription.id });

    if (updated.length === 0) {
      console.log(
        `Ignoring stale subscription.revoked webhook for subscription ${subscriptionData.id}`
      );
      return;
    }

    console.log(
      `Successfully marked subscription ${subscriptionData.id} as revoked/expired for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    console.error("Error updating subscription to revoked in DB:", error);
  }
}
