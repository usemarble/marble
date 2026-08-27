"use server";

import { db, createRecordId } from "@marble/drizzle";

import { subscription, user, workspace } from "@marble/drizzle/schema";

import { eq } from "drizzle-orm";
import type { WebhookSubscriptionCreatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload.js";
import {
  getPlanType,
  getRecurringInterval,
  getSubscriptionStatus,
} from "./utils";

export async function handleSubscriptionCreated(
  payload: WebhookSubscriptionCreatedPayload
) {
  const { data: subscriptionData } = payload;
  const workspaceId = subscriptionData.metadata?.referenceId;
  const userId = subscriptionData.customer.externalId;

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

  if (!subscriptionData.currentPeriodStart) {
    console.error(
      "subscription.created webhook received without a currentPeriodStart"
    );
    return;
  }

  if (!subscriptionData.currentPeriodEnd) {
    console.error(
      "subscription.created webhook received without a currentPeriodEnd"
    );
    return;
  }

  const currentPeriodStart = subscriptionData.currentPeriodStart;
  const currentPeriodEnd = subscriptionData.currentPeriodEnd;

  const userExists = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  if (!userExists) {
    console.error(`User with id ${userId} not found.`);
    return;
  }

  const workspaceExists = await db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
  });
  if (!workspaceExists) {
    console.error(`Workspace with id ${workspaceId} not found.`);
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

  const recurringInterval = getRecurringInterval(
    subscriptionData.recurringInterval
  );

  try {
    const existingSubscription = await db.query.subscription.findFirst({
      where: eq(subscription.polarId, subscriptionData.id),
    });

    if (existingSubscription) {
      console.log(
        `Subscription ${subscriptionData.id} already exists, skipping creation`
      );
      return;
    }

    await db.insert(subscription).values({
      id: createRecordId(),
      polarId: subscriptionData.id,
      plan,
      status,
      currentPeriodStart: new Date(currentPeriodStart),
      currentPeriodEnd: new Date(currentPeriodEnd),
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
      userId,
      workspaceId,
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
    });

    console.log(
      `Successfully created subscription ${subscriptionData.id} for workspace ${workspaceId}`
    );
  } catch (error) {
    console.error("Error creating subscription in DB:", error);
  }
}
