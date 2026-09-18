"use server";

import { db } from "@marble/db";
import { subscription } from "@marble/db/schema";
import type { WebhookSubscriptionCanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncanceledpayload.js";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { getSubscriptionStatus, isStalePolarEvent } from "./utils";

export async function handleSubscriptionCanceled(
  payload: WebhookSubscriptionCanceledPayload
) {
  const { data: subscriptionData } = payload;

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
    isStalePolarEvent(existingSubscription.lastPolarEventAt, payload.timestamp)
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
