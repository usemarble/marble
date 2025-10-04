"use server";

import { db } from "@marble/db";
import type { WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload.js";
import { PlanType, SubscriptionStatus } from "@prisma/client";

function getPlanType(productName: string): PlanType | null {
  const plan = productName.toLowerCase();
  if (plan === "pro") {
    return PlanType.pro;
  }
  if (plan === "team") {
    return PlanType.team;
  }
  return null;
}

function getSubscriptionStatus(
  polarStatus: WebhookSubscriptionUpdatedPayload["data"]["status"]
): SubscriptionStatus | null {
  switch (polarStatus) {
    case "active":
      return SubscriptionStatus.active;
    case "trialing":
      return SubscriptionStatus.trialing;
    case "canceled":
      return SubscriptionStatus.cancelled;
    case "past_due":
    case "incomplete":
    case "unpaid":
      return SubscriptionStatus.past_due;
    case "incomplete_expired":
      return SubscriptionStatus.expired;
    default:
      return null;
  }
}

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
      },
    });

    console.log(
      `Successfully updated subscription ${subscription.id} for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    console.error("Error updating subscription in DB:", error);
  }
}
