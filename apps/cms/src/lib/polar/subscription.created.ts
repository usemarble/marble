"use server";

import { db } from "@marble/db";
import type { WebhookSubscriptionCreatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload.js";
import {
  getPlanType,
  getRecurringInterval,
  getSubscriptionStatus,
} from "./utils";

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

  // Store validated dates to satisfy TypeScript
  const currentPeriodStart = subscription.currentPeriodStart;
  const currentPeriodEnd = subscription.currentPeriodEnd;

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

  const recurringInterval = getRecurringInterval(
    subscription.recurringInterval
  );

  try {
    // Check if subscription already exists (upsert pattern)
    const existingSubscription = await db.subscription.findUnique({
      where: { polarId: subscription.id },
    });

    if (existingSubscription) {
      console.log(
        `Subscription ${subscription.id} already exists, skipping creation`
      );
      return;
    }

    // Create new subscription (allow multiple subscriptions per workspace)
    await db.subscription.create({
      data: {
        polarId: subscription.id,
        plan,
        status,
        currentPeriodStart: new Date(currentPeriodStart),
        currentPeriodEnd: new Date(currentPeriodEnd),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        userId,
        workspaceId,
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
      `Successfully created subscription ${subscription.id} for workspace ${workspaceId}`
    );
  } catch (error) {
    console.error("Error creating subscription in DB:", error);
  }
}
