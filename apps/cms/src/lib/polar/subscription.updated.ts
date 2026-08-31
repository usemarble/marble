"use server";

import { db } from "@marble/drizzle";
import { subscription } from "@marble/drizzle/schema";
import type { WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload.js";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import {
  getPlanType,
  getRecurringInterval,
  getSubscriptionStatus,
  isStalePolarEvent,
} from "./utils";

export async function handleSubscriptionUpdated(
  payload: WebhookSubscriptionUpdatedPayload
) {
  const { data: subscriptionData } = payload;

  const existingSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.polarId, subscriptionData.id),
  });

  if (!existingSubscription) {
    console.error(
      `subscription.updated webhook received for a subscription that does not exist: ${subscriptionData.id}`
    );
    return;
  }

  if (
    isStalePolarEvent(existingSubscription.lastPolarEventAt, payload.timestamp)
  ) {
    console.log(
      `Ignoring stale subscription.updated webhook for subscription ${subscriptionData.id}`
    );
    return;
  }

  const plan = getPlanType(subscriptionData.product.name);
  if (!plan) {
    console.error(`Unknown plan: ${subscriptionData.product.name}`);
    return;
  }

  const status = getSubscriptionStatus(subscriptionData.status);
  if (!status) {
    console.error(
      `Unknown subscription status from Polar: ${subscriptionData.status}`
    );
    return;
  }

  if (
    !subscriptionData.currentPeriodStart ||
    !subscriptionData.currentPeriodEnd
  ) {
    console.error(
      "subscription.updated webhook received without currentPeriodStart or currentPeriodEnd"
    );
    return;
  }

  const recurringInterval = getRecurringInterval(
    subscriptionData.recurringInterval
  );

  try {
    const updated = await db
      .update(subscription)
      .set({
        plan,
        status,
        currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
        currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
        canceledAt: subscriptionData.canceledAt
          ? new Date(subscriptionData.canceledAt)
          : null,
        endedAt: subscriptionData.endedAt
          ? new Date(subscriptionData.endedAt)
          : null,
        endsAt: subscriptionData.endsAt
          ? new Date(subscriptionData.endsAt)
          : null,
        startedAt: subscriptionData.startedAt
          ? new Date(subscriptionData.startedAt)
          : null,
        productId: subscriptionData.productId || undefined,
        amount: subscriptionData.amount
          ? Math.round(subscriptionData.amount)
          : undefined,
        currency: subscriptionData.currency || undefined,
        discountId: subscriptionData.discountId || undefined,
        lastPolarEventAt: payload.timestamp,
        recurringInterval,
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
        `Ignoring stale subscription.updated webhook for subscription ${subscriptionData.id}`
      );
      return;
    }

    console.log(
      `Successfully updated subscription ${subscriptionData.id} for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    console.error("Error updating subscription in DB:", error);
  }
}
