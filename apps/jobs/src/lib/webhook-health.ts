import { createRecordId } from "@marble/db/id";
import { webhookEndpoint, webhookNotification } from "@marble/db/schema";
import { and, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type { DbSession } from "./db";

export const WEBHOOK_FAILURE_WARNING_COUNT = 10;
export const WEBHOOK_FAILURE_WARNING_MS = 10 * 60_000;
export const WEBHOOK_FAILURE_DISABLE_DAYS = 3;
export const WEBHOOK_FAILURE_DISABLE_MS =
  WEBHOOK_FAILURE_DISABLE_DAYS * 86_400_000;

type EndpointHealth = Pick<
  typeof webhookEndpoint.$inferSelect,
  | "enabled"
  | "consecutiveFailures"
  | "failureStartedAt"
  | "lastFailureAt"
  | "lastFailureEmailAt"
  | "failureIncidentId"
>;

export function webhookWarningDue(endpoint: EndpointHealth, now: Date) {
  return (
    endpoint.enabled &&
    endpoint.failureIncidentId !== null &&
    endpoint.consecutiveFailures >= WEBHOOK_FAILURE_WARNING_COUNT &&
    endpoint.failureStartedAt !== null &&
    now.getTime() - endpoint.failureStartedAt.getTime() >=
      WEBHOOK_FAILURE_WARNING_MS &&
    endpoint.lastFailureEmailAt === null
  );
}

export function webhookDisableDue(endpoint: EndpointHealth, now: Date) {
  if (
    !endpoint.enabled ||
    !endpoint.failureIncidentId ||
    !endpoint.lastFailureEmailAt ||
    !endpoint.lastFailureAt
  ) {
    return false;
  }
  const deadline =
    endpoint.lastFailureEmailAt.getTime() + WEBHOOK_FAILURE_DISABLE_MS;
  // Quiet endpoints are not assumed broken forever. Require a failed outbound
  // request after the warning's grace period, with no intervening success.
  return (
    endpoint.consecutiveFailures >= WEBHOOK_FAILURE_WARNING_COUNT &&
    now.getTime() >= deadline &&
    endpoint.lastFailureAt.getTime() >= deadline
  );
}

export interface WebhookEndpointOutcome {
  endpointId: string;
  url: string;
  observedAt: Date;
  success: boolean;
  isTest: boolean;
}

/** Called only for owned, completed outbound requests, in their delivery transaction. */
export async function recordWebhookEndpointOutcome(
  db: DbSession,
  outcome: WebhookEndpointOutcome
) {
  // Manual tests can prove recovery, but failed demo payloads cannot disable an endpoint.
  if (outcome.isTest && !outcome.success) {
    return;
  }
  const where = and(
    eq(webhookEndpoint.id, outcome.endpointId),
    eq(webhookEndpoint.url, outcome.url),
    outcome.isTest ? undefined : eq(webhookEndpoint.enabled, true),
    or(
      isNull(webhookEndpoint.lastDeliveryOutcomeAt),
      lte(webhookEndpoint.lastDeliveryOutcomeAt, outcome.observedAt)
    )
  );
  if (outcome.success) {
    const recovered = await db
      .update(webhookEndpoint)
      .set({
        consecutiveFailures: 0,
        failureStartedAt: null,
        lastFailureAt: null,
        failureIncidentId: null,
        lastFailureEmailAt: null,
        lastDeliveryOutcomeAt: outcome.observedAt,
      })
      .where(where)
      .returning({ id: webhookEndpoint.id });
    if (recovered.length > 0) {
      await db
        .update(webhookNotification)
        .set({ status: "cancelled", claimedAt: null })
        .where(
          and(
            eq(webhookNotification.webhookEndpointId, outcome.endpointId),
            eq(webhookNotification.kind, "warning"),
            inArray(webhookNotification.status, ["pending", "sending"])
          )
        );
    }
    return;
  }
  await db
    .update(webhookEndpoint)
    .set({
      consecutiveFailures: sql`${webhookEndpoint.consecutiveFailures} + 1`,
      failureStartedAt: sql`coalesce(${webhookEndpoint.failureStartedAt}, ${outcome.observedAt.toISOString()})`,
      failureIncidentId: sql`coalesce(${webhookEndpoint.failureIncidentId}, ${createRecordId()})`,
      lastFailureAt: outcome.observedAt,
      lastDeliveryOutcomeAt: outcome.observedAt,
    })
    .where(where);
}
