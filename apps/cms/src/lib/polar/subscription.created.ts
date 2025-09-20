"use server";

import { db } from "@marble/db";
import type { WebhookSubscriptionCreatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload.js";
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
  polarStatus: WebhookSubscriptionCreatedPayload["data"]["status"]
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

export async function handleSubscriptionCreated(
  payload: WebhookSubscriptionCreatedPayload
) {
  const { data: subscription } = payload;
  const workspaceId = subscription.metadata?.referenceId;
  const userId = subscription.customer.externalId;

  if (typeof workspaceId !== "string") {
    console.error(
      "subscription.created webhook received without a string workspaceId in metadata.referenceId"
    );
    return;
  }

  if (typeof userId !== "string") {
    console.error(
      "subscription.created webhook received without a string userId in customer.externalId"
    );
    return;
  }

  if (!subscription.currentPeriodStart) {
    console.error(
      "subscription.created webhook received without a currentPeriodStart"
    );
    return;
  }

  if (!subscription.currentPeriodEnd) {
    console.error(
      "subscription.created webhook received without a currentPeriodEnd"
    );
    return;
  }

  const userExists = await db.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    console.error(`User with id ${userId} not found.`);
    return;
  }

  const workspaceExists = await db.organization.findUnique({
    where: { id: workspaceId },
  });
  if (!workspaceExists) {
    console.error(`Workspace with id ${workspaceId} not found.`);
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

  try {
    await db.subscription.create({
      data: {
        polarId: subscription.id,
        plan,
        status,
        currentPeriodStart: new Date(subscription.currentPeriodStart),
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        userId,
        workspaceId,
      },
    });

    console.log(
      `Successfully created subscription for workspace ${workspaceId}`
    );
  } catch (error) {
    console.error("Error creating subscription in DB:", error);
  }
}
