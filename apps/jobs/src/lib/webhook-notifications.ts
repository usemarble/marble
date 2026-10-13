import { createRecordId } from "@marble/db/id";
import {
  member,
  user,
  type WebhookNotificationPayload,
  webhookDelivery,
  webhookDeliveryAttempt,
  webhookEndpoint,
  webhookNotification,
  workspace,
} from "@marble/db/schema";
import { sendWebhookFailureEmail } from "@marble/email";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  notExists,
  or,
  sql,
} from "drizzle-orm";
import { Resend } from "resend";
import type { DbClient, DbTransaction } from "./db";
import {
  WEBHOOK_FAILURE_DISABLE_DAYS,
  WEBHOOK_FAILURE_DISABLE_MS,
  WEBHOOK_FAILURE_WARNING_COUNT,
  WEBHOOK_FAILURE_WARNING_MS,
  webhookDisableDue,
  webhookWarningDue,
} from "./webhook-health";

const NOTIFICATION_LEASE_MS = 5 * 60_000;
// Resend caches idempotency keys for 24 hours. Stop before that boundary rather
// than send a possible duplicate after an ambiguous request/database failure.
const EMAIL_RETRY_WINDOW_MS = 23 * 60 * 60_000;
const BATCH_SIZE = 100;
type Notification = typeof webhookNotification.$inferSelect;

async function queueEndpointNotification(
  tx: DbTransaction,
  endpointId: string,
  appUrl: string,
  now: Date
) {
  // Lock order is endpoint then notification, also used by manual reset and recovery.
  const [endpoint] = await tx
    .select()
    .from(webhookEndpoint)
    .where(eq(webhookEndpoint.id, endpointId))
    .for("update");
  if (!endpoint?.failureIncidentId || !endpoint.failureStartedAt) {
    return;
  }
  const warning = webhookWarningDue(endpoint, now);
  const disabled = webhookDisableDue(endpoint, now);
  if (!warning && !disabled) {
    return;
  }
  const [foundWorkspace] = await tx
    .select({ name: workspace.name, slug: workspace.slug })
    .from(workspace)
    .where(eq(workspace.id, endpoint.workspaceId));
  if (!foundWorkspace) {
    return;
  }
  // Operational alerts go to the people who can repair the endpoint. Quota
  // alert preferences do not silently opt a workspace out of failure notices.
  const recipients = await tx
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(
      and(
        eq(member.organizationId, endpoint.workspaceId),
        inArray(member.role, ["owner", "admin"])
      )
    );
  const recipientEmails = [
    ...new Set(recipients.map((recipient) => recipient.email)),
  ].sort();
  if (recipientEmails.length === 0) {
    console.error(
      `[WebhookNotifications] No owner or admin for ${endpoint.workspaceId}`
    );
    return;
  }
  const [latest] = await tx
    .select({
      statusCode: webhookDeliveryAttempt.statusCode,
      responseBody: webhookDeliveryAttempt.responseBody,
      errorMessage: webhookDeliveryAttempt.errorMessage,
    })
    .from(webhookDeliveryAttempt)
    .innerJoin(
      webhookDelivery,
      eq(webhookDeliveryAttempt.deliveryId, webhookDelivery.id)
    )
    .where(
      and(
        eq(webhookDelivery.webhookEndpointId, endpoint.id),
        eq(webhookDelivery.url, endpoint.url),
        eq(webhookDelivery.isTest, false),
        eq(webhookDeliveryAttempt.success, false),
        gte(webhookDeliveryAttempt.createdAt, endpoint.failureStartedAt)
      )
    )
    .orderBy(
      desc(webhookDeliveryAttempt.createdAt),
      desc(webhookDeliveryAttempt.attemptNumber)
    )
    .limit(1);
  const latestError = latest?.errorMessage || latest?.responseBody || null;
  const payload: WebhookNotificationPayload = {
    endpointName: endpoint.name,
    endpointUrl: endpoint.url,
    workspaceName: foundWorkspace.name,
    dashboardUrl: new URL(
      `${encodeURIComponent(foundWorkspace.slug)}/settings/webhooks/${encodeURIComponent(endpoint.id)}`,
      `${appUrl.replace(/\/$/, "")}/`
    ).toString(),
    consecutiveFailures: endpoint.consecutiveFailures,
    failureStartedAt: endpoint.failureStartedAt.toISOString(),
    latestStatusCode: latest?.statusCode ?? null,
    latestError,
    disableGraceDays: WEBHOOK_FAILURE_DISABLE_DAYS,
  };
  if (disabled) {
    const detail = latest?.statusCode
      ? `HTTP ${latest.statusCode}`
      : latestError || "No HTTP response recorded";
    await tx
      .update(webhookEndpoint)
      .set({
        enabled: false,
        disabledAt: now,
        disabledReason: `Delivery failures continued for ${WEBHOOK_FAILURE_DISABLE_DAYS} days after the warning. Latest result: ${detail.slice(0, 500)}`,
      })
      .where(eq(webhookEndpoint.id, endpoint.id));
  }
  await tx
    .insert(webhookNotification)
    .values({
      id: createRecordId(),
      webhookEndpointId: endpoint.id,
      workspaceId: endpoint.workspaceId,
      incidentId: endpoint.failureIncidentId,
      kind: disabled ? "disabled" : "warning",
      payload,
      recipientEmails,
      nextAttemptAt: now,
    })
    .onConflictDoNothing({
      target: [
        webhookNotification.webhookEndpointId,
        webhookNotification.incidentId,
        webhookNotification.kind,
      ],
    });
}

export async function queueWebhookFailureNotifications(
  db: DbClient,
  appUrl: string,
  now = new Date()
) {
  const endpoints = await db
    .select({ id: webhookEndpoint.id })
    .from(webhookEndpoint)
    .where(
      and(
        eq(webhookEndpoint.enabled, true),
        gte(webhookEndpoint.consecutiveFailures, WEBHOOK_FAILURE_WARNING_COUNT),
        or(
          and(
            isNull(webhookEndpoint.lastFailureEmailAt),
            lte(
              webhookEndpoint.failureStartedAt,
              new Date(now.getTime() - WEBHOOK_FAILURE_WARNING_MS)
            ),
            notExists(
              db
                .select({ id: webhookNotification.id })
                .from(webhookNotification)
                .where(
                  and(
                    eq(
                      webhookNotification.webhookEndpointId,
                      webhookEndpoint.id
                    ),
                    eq(
                      webhookNotification.incidentId,
                      webhookEndpoint.failureIncidentId
                    ),
                    eq(webhookNotification.kind, "warning")
                  )
                )
            )
          ),
          and(
            lte(
              webhookEndpoint.lastFailureEmailAt,
              new Date(now.getTime() - WEBHOOK_FAILURE_DISABLE_MS)
            ),
            sql`${webhookEndpoint.lastFailureAt} >= ${webhookEndpoint.lastFailureEmailAt} + ${WEBHOOK_FAILURE_DISABLE_MS} * interval '1 millisecond'`
          )
        )
      )
    )
    .orderBy(asc(webhookEndpoint.lastFailureAt))
    .limit(BATCH_SIZE);
  for (const endpoint of endpoints) {
    try {
      await db.transaction((tx) =>
        queueEndpointNotification(tx, endpoint.id, appUrl, now)
      );
    } catch (error) {
      console.error(
        `[WebhookNotifications] Failed to evaluate ${endpoint.id}:`,
        error
      );
    }
  }
}

function notificationLeaseWhere(notification: Notification) {
  if (!notification.claimedAt) {
    throw new Error(`Notification ${notification.id} has no sending lease`);
  }
  return and(
    eq(webhookNotification.id, notification.id),
    eq(webhookNotification.status, "sending"),
    eq(webhookNotification.claimedAt, notification.claimedAt),
    eq(webhookNotification.attemptCount, notification.attemptCount)
  );
}

function notificationIsCurrent(
  notification: Notification,
  endpoint: typeof webhookEndpoint.$inferSelect | undefined
) {
  if (!endpoint || endpoint.url !== notification.payload.endpointUrl) {
    return false;
  }
  return notification.kind === "warning"
    ? endpoint.enabled &&
        endpoint.failureIncidentId === notification.incidentId &&
        endpoint.consecutiveFailures >= WEBHOOK_FAILURE_WARNING_COUNT
    : !endpoint.enabled && endpoint.disabledAt !== null;
}

export function notificationRetryAt(attempt: number, now: Date) {
  const delay = Math.min(3600, 60 * 2 ** Math.min(6, Math.max(0, attempt - 1)));
  return new Date(
    now.getTime() + (delay + Math.floor(Math.random() * 15)) * 1000
  );
}

/** Durable snapshot + provider key keep retries of one incident's email identical. */
export async function sendPendingWebhookNotifications(
  db: DbClient,
  resendApiKey: string | undefined,
  now = new Date()
) {
  if (!resendApiKey) {
    console.error(
      "[WebhookNotifications] RESEND_API_KEY is not configured; notifications remain pending"
    );
    return;
  }
  const staleBefore = new Date(now.getTime() - NOTIFICATION_LEASE_MS);
  const dueWhere = and(
    lte(webhookNotification.nextAttemptAt, now),
    or(
      eq(webhookNotification.status, "pending"),
      and(
        eq(webhookNotification.status, "sending"),
        lte(webhookNotification.claimedAt, staleBefore)
      )
    )
  );
  const due = await db
    .select({ id: webhookNotification.id })
    .from(webhookNotification)
    .where(dueWhere)
    .orderBy(asc(webhookNotification.nextAttemptAt))
    .limit(BATCH_SIZE);
  const resend = new Resend(resendApiKey);
  for (const row of due) {
    const [notification] = await db
      .update(webhookNotification)
      .set({
        status: "sending",
        claimedAt: now,
        attemptCount: sql`${webhookNotification.attemptCount} + 1`,
        firstAttemptAt: sql`coalesce(${webhookNotification.firstAttemptAt}, ${now.toISOString()})`,
      })
      .where(and(eq(webhookNotification.id, row.id), dueWhere))
      .returning();
    if (!notification) {
      continue;
    }
    try {
      const endpoint = await db.query.webhookEndpoint.findFirst({
        where: eq(webhookEndpoint.id, notification.webhookEndpointId),
      });
      if (!notificationIsCurrent(notification, endpoint)) {
        await db
          .update(webhookNotification)
          .set({ status: "cancelled", claimedAt: null })
          .where(notificationLeaseWhere(notification));
        continue;
      }
      if (
        notification.firstAttemptAt &&
        now.getTime() - notification.firstAttemptAt.getTime() >=
          EMAIL_RETRY_WINDOW_MS
      ) {
        console.error(
          `[WebhookNotifications] Notification ${notification.id} exceeded its safe email retry window; review is required`
        );
        await db
          .update(webhookNotification)
          .set({
            status: "failed",
            claimedAt: null,
            lastError:
              "Email delivery could not be confirmed within the provider idempotency window; automatic retries stopped to avoid a duplicate.",
          })
          .where(notificationLeaseWhere(notification));
        continue;
      }
      const result = await sendWebhookFailureEmail(
        resend,
        {
          ...notification.payload,
          stage: notification.kind,
          failureStartedAt: new Date(notification.payload.failureStartedAt),
          userEmail: notification.recipientEmails,
        },
        `webhook-failure/${notification.id}`
      );
      if (result.error) {
        throw new Error(`${result.error.name}: ${result.error.message}`);
      }
      if (!result.data?.id) {
        throw new Error("Email provider returned no message ID");
      }
      await db.transaction(async (tx) => {
        const [currentEndpoint] = await tx
          .select()
          .from(webhookEndpoint)
          .where(eq(webhookEndpoint.id, notification.webhookEndpointId))
          .for("update");
        const sent = await tx
          .update(webhookNotification)
          .set({
            status: "sent",
            sentAt: new Date(),
            claimedAt: null,
            lastError: null,
          })
          .where(notificationLeaseWhere(notification))
          .returning({ id: webhookNotification.id });
        if (
          sent.length > 0 &&
          notification.kind === "warning" &&
          notificationIsCurrent(notification, currentEndpoint)
        ) {
          await tx
            .update(webhookEndpoint)
            .set({ lastFailureEmailAt: new Date() })
            .where(eq(webhookEndpoint.id, notification.webhookEndpointId));
        }
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[WebhookNotifications] Failed to send ${notification.id}:`,
        errorMessage
      );
      await db
        .update(webhookNotification)
        .set({
          status: "pending",
          claimedAt: null,
          lastError: errorMessage.slice(0, 1000),
          nextAttemptAt: notificationRetryAt(
            notification.attemptCount,
            new Date()
          ),
        })
        .where(notificationLeaseWhere(notification));
    }
  }
}
