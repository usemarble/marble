import type { DbClient } from "@marble/db";
import { subscription } from "@marble/db/schema";
import type { webhooks } from "@polar-sh/sdk/2026-10";
import type { Redis } from "@upstash/redis";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { clearWorkspacePlan } from "../access";
import {
  getPlanType,
  getRecurringInterval,
  getSubscriptionStatus,
  isStalePolarEvent,
} from "./utils";

export async function handleSubscriptionUpdated(
  db: DbClient,
  redis: Redis,
  payload: webhooks.WebhookSubscriptionUpdatedPayload
) {
  const { data: subscriptionData } = payload;
  const eventTimestamp = new Date(payload.timestamp);

  const existingSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.polarId, subscriptionData.id),
  });

  if (!existingSubscription) {
    // Fail the delivery so Polar retries rather than dropping the update
    // because subscription.created has not been stored yet.
    throw new Error(
      `subscription.updated webhook received for a subscription that does not exist: ${subscriptionData.id}`
    );
  }

  if (
    isStalePolarEvent(existingSubscription.lastPolarEventAt, eventTimestamp)
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
    !subscriptionData.current_period_start ||
    !subscriptionData.current_period_end
  ) {
    console.error(
      "subscription.updated webhook received without currentPeriodStart or currentPeriodEnd"
    );
    return;
  }

  const recurringInterval = getRecurringInterval(
    subscriptionData.recurring_interval
  );

  try {
    const updated = await db
      .update(subscription)
      .set({
        plan,
        status,
        currentPeriodStart: new Date(subscriptionData.current_period_start),
        currentPeriodEnd: new Date(subscriptionData.current_period_end),
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
        canceledAt: subscriptionData.canceled_at
          ? new Date(subscriptionData.canceled_at)
          : null,
        endedAt: subscriptionData.ended_at
          ? new Date(subscriptionData.ended_at)
          : null,
        endsAt: subscriptionData.ends_at
          ? new Date(subscriptionData.ends_at)
          : null,
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
      })
      .where(
        and(
          eq(subscription.polarId, subscriptionData.id),
          or(
            isNull(subscription.lastPolarEventAt),
            lte(subscription.lastPolarEventAt, eventTimestamp)
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
    await clearWorkspacePlan(redis, existingSubscription.workspaceId);

    console.log(
      `Successfully updated subscription ${subscriptionData.id} for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    // Rethrow so the endpoint returns non-2xx and Polar retries: swallowing
    // here loses the state change permanently.
    console.error("Error updating subscription in DB:", error);
    throw error;
  }
}
