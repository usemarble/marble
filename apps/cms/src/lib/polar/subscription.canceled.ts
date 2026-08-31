"use server";

import { db } from "@marble/drizzle";
import { subscription } from "@marble/drizzle/schema";
import type { WebhookSubscriptionCanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncanceledpayload.js";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { isStalePolarEvent } from "./utils";

export async function handleSubscriptionCanceled(
  payload: WebhookSubscriptionCanceledPayload
) {
  const { data: subscriptionData } = payload;

  const existingSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.polarId, subscriptionData.id),
  });

  if (!existingSubscription) {
    console.error(
      `subscription.canceled webhook received for a subscription that does not exist: ${subscriptionData.id}`
    );
    return;
  }

  if (
    isStalePolarEvent(existingSubscription.lastPolarEventAt, payload.timestamp)
  ) {
    console.log(
      `Ignoring stale subscription.canceled webhook for subscription ${subscriptionData.id}`
    );
    return;
  }

  try {
    const updated = await db
      .update(subscription)
      .set({
        status: "canceled",
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
        canceledAt: subscriptionData.canceledAt
          ? new Date(subscriptionData.canceledAt)
          : new Date(),
        endsAt: subscriptionData.endsAt
          ? new Date(subscriptionData.endsAt)
          : null,
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
        `Ignoring stale subscription.canceled webhook for subscription ${subscriptionData.id}`
      );
      return;
    }

    console.log(
      `Successfully marked subscription ${subscriptionData.id} as canceled for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    console.error("Error updating subscription to canceled in DB:", error);
  }
}
