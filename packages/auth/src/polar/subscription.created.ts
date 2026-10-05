import type { DbClient } from "@marble/db";
import { createRecordId } from "@marble/db/id";
import { subscription, user, workspace } from "@marble/db/schema";
import type { webhooks } from "@polar-sh/sdk/2026-10";
import type { Redis } from "@upstash/redis";
import { eq } from "drizzle-orm";
import { clearWorkspacePlan } from "../access";
import {
  getPlanType,
  getRecurringInterval,
  getSubscriptionStatus,
} from "./utils";

export async function handleSubscriptionCreated(
  db: DbClient,
  redis: Redis,
  payload: webhooks.WebhookSubscriptionCreatedPayload
) {
  const { data: subscriptionData } = payload;
  const eventTimestamp = new Date(payload.timestamp);
  const workspaceId = subscriptionData.metadata?.referenceId;
  const userId = subscriptionData.customer.external_id;

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

  if (!subscriptionData.current_period_start) {
    console.error(
      "subscription.created webhook received without a currentPeriodStart"
    );
    return;
  }

  if (!subscriptionData.current_period_end) {
    console.error(
      "subscription.created webhook received without a currentPeriodEnd"
    );
    return;
  }

  const currentPeriodStart = subscriptionData.current_period_start;
  const currentPeriodEnd = subscriptionData.current_period_end;

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
    subscriptionData.recurring_interval
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
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
      userId,
      workspaceId,
      startedAt: subscriptionData.started_at
        ? new Date(subscriptionData.started_at)
        : null,
      productId: subscriptionData.product_id || undefined,
      amount: subscriptionData.amount
        ? Math.round(subscriptionData.amount)
        : undefined,
      currency: subscriptionData.currency || undefined,
      discountId: subscriptionData.discount_id || undefined,
      lastPolarEventAt: eventTimestamp,
      recurringInterval,
      updatedAt: new Date(),
    });
    await clearWorkspacePlan(redis, workspaceId);

    console.log(
      `Successfully created subscription ${subscriptionData.id} for workspace ${workspaceId}`
    );
  } catch (error) {
    // Rethrow so the endpoint returns non-2xx and Polar retries: swallowing
    // here loses the state change permanently.
    console.error("Error creating subscription in DB:", error);
    throw error;
  }
}
