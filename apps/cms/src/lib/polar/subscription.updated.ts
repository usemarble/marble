"use server";

import { db } from "@marble/db";
import type { WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload.js";
import {
  getPlanType,
  getRecurringInterval,
  getSubscriptionStatus,
} from "./utils";

export async function handleSubscriptionUpdated(
  payload: WebhookSubscriptionUpdatedPayload
) {
  const { data: subscription } = payload;

  const existingSubscription = await db.subscription.findUnique({
    where: { polarId: subscription.id },
  });

  if (!existingSubscription) {
    console.error(
      `subscription.updated webhook received for a subscription that does not exist: ${subscription.id}`
    );
    return;
  }

  const plan = getPlanType(subscription.product.name);
  if (!plan) {
    console.error(`Unknown plan: ${subscription.product.name}`);
    return;
  }

  const status = getSubscriptionStatus(subscription.status);
  if (!status) {
    console.error(
      `Unknown subscription status from Polar: ${subscription.status}`
    );
    return;
  }

  if (!subscription.currentPeriodStart || !subscription.currentPeriodEnd) {
    console.error(
      "subscription.updated webhook received without currentPeriodStart or currentPeriodEnd"
    );
    return;
  }

  const recurringInterval = getRecurringInterval(
    subscription.recurringInterval
  );

  try {
    await db.subscription.update({
      where: { polarId: subscription.id },
      data: {
        plan,
        status,
        currentPeriodStart: new Date(subscription.currentPeriodStart),
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt
          ? new Date(subscription.canceledAt)
          : null,
        endedAt: subscription.endedAt ? new Date(subscription.endedAt) : null,
        endsAt: subscription.endsAt ? new Date(subscription.endsAt) : null,
        startedAt: subscription.startedAt
          ? new Date(subscription.startedAt)
          : null,
        productId: subscription.productId || undefined,
        amount: subscription.amount
          ? Math.round(subscription.amount)
          : undefined,
        currency: subscription.currency || undefined,
        discountId: subscription.discountId || undefined,
        recurringInterval,
      },
    });

    console.log(
      `Successfully updated subscription ${subscription.id} for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    console.error("Error updating subscription in DB:", error);
  }
}
