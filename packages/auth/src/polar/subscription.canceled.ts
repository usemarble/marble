import type { DbClient } from "@marble/db";
import { subscription } from "@marble/db/schema";
import type { webhooks } from "@polar-sh/sdk/2026-10";
import type { Redis } from "@upstash/redis";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { clearWorkspacePlan } from "../access";
import { getSubscriptionStatus, isStalePolarEvent } from "./utils";

export async function handleSubscriptionCanceled(
  db: DbClient,
  redis: Redis,
  payload: webhooks.WebhookSubscriptionCanceledPayload
) {
  const { data: subscriptionData } = payload;
  const eventTimestamp = new Date(payload.timestamp);

  const existingSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.polarId, subscriptionData.id),
  });

  if (!existingSubscription) {
    // Almost always means subscription.created has not been stored yet. Fail
    // the delivery so Polar retries instead of dropping the cancellation.
    throw new Error(
      `subscription.canceled webhook received for a subscription that does not exist: ${subscriptionData.id}`
    );
  }

  if (
    isStalePolarEvent(existingSubscription.lastPolarEventAt, eventTimestamp)
  ) {
    console.log(
      `Ignoring stale subscription.canceled webhook for subscription ${subscriptionData.id}`
    );
    return;
  }

  // Polar leaves a subscription `trialing`/`active` while a cancellation is
  // only scheduled, so mirror the status it sends rather than forcing
  // "canceled". That stops this handler and subscription.updated from writing
  // different statuses for the same state, which makes the stored row
  // independent of the order the two events arrive in. Entitlement is decided
  // from cancelAtPeriodEnd and currentPeriodEnd, not from the status alone.
  const status = getSubscriptionStatus(subscriptionData.status);
  if (!status) {
    // Retrying cannot fix an unrecognised status, so do not fail the delivery.
    console.error(
      `Unknown subscription status from Polar: ${subscriptionData.status}`
    );
    return;
  }

  try {
    const updated = await db
      .update(subscription)
      .set({
        status,
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
        canceledAt: subscriptionData.canceled_at
          ? new Date(subscriptionData.canceled_at)
          : new Date(),
        endsAt: subscriptionData.ends_at
          ? new Date(subscriptionData.ends_at)
          : null,
        lastPolarEventAt: eventTimestamp,
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
        `Ignoring stale subscription.canceled webhook for subscription ${subscriptionData.id}`
      );
      return;
    }
    await clearWorkspacePlan(redis, existingSubscription.workspaceId);

    console.log(
      `Successfully recorded cancellation for subscription ${subscriptionData.id} for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    // Rethrow so the endpoint returns non-2xx and Polar retries: swallowing
    // here loses the state change permanently, which would leave the workspace
    // on a paid plan forever.
    console.error("Error updating subscription to canceled in DB:", error);
    throw error;
  }
}
