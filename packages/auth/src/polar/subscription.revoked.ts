import type { DbClient } from "@marble/db";
import { subscription } from "@marble/db/schema";
import type { webhooks } from "@polar-sh/sdk/2026-10";
import type { Redis } from "@upstash/redis";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { clearWorkspacePlan } from "../access";
import { isStalePolarEvent } from "./utils";

export async function handleSubscriptionRevoked(
  db: DbClient,
  redis: Redis,
  payload: webhooks.WebhookSubscriptionRevokedPayload
) {
  const { data: subscriptionData } = payload;
  const eventTimestamp = new Date(payload.timestamp);

  const existingSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.polarId, subscriptionData.id),
  });

  if (!existingSubscription) {
    // Fail the delivery so Polar retries rather than leaving the workspace on a
    // paid plan because subscription.created has not been stored yet.
    throw new Error(
      `subscription.revoked webhook received for a subscription that does not exist: ${subscriptionData.id}`
    );
  }

  if (
    isStalePolarEvent(existingSubscription.lastPolarEventAt, eventTimestamp)
  ) {
    console.log(
      `Ignoring stale subscription.revoked webhook for subscription ${subscriptionData.id}`
    );
    return;
  }

  try {
    const updated = await db
      .update(subscription)
      .set({
        status: "expired",
        endedAt: subscriptionData.ended_at
          ? new Date(subscriptionData.ended_at)
          : new Date(),
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
        `Ignoring stale subscription.revoked webhook for subscription ${subscriptionData.id}`
      );
      return;
    }
    await clearWorkspacePlan(redis, existingSubscription.workspaceId);

    console.log(
      `Successfully marked subscription ${subscriptionData.id} as revoked/expired for workspace ${existingSubscription.workspaceId}`
    );
  } catch (error) {
    // Rethrow so the endpoint returns non-2xx and Polar retries: swallowing
    // here loses the state change permanently.
    console.error("Error updating subscription to revoked in DB:", error);
    throw error;
  }
}
