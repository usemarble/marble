import { env } from "cloudflare:workers";
import { createRecordId } from "@marble/db/id";
import { webhookDelivery, webhookDeliveryAttempt } from "@marble/db/schema";
import { buildWebhookPayload, serializeEventType } from "@marble/events";
import { WEBHOOK_DELIVERY_TIMEOUT_MS } from "@/lib/constants";
import type { DbClient } from "@/lib/db";
import { createDbClient } from "@/lib/db";
import { buildWebhookRequestBody } from "@/lib/formats";
import { signPayload } from "@/lib/signing";
import {
  checkWebhookUsage,
  recordWebhookUsage,
  sendWebhookUsageAlert,
} from "@/lib/usage";
import {
  claimWebhookDeliveryAttempt,
  renewWebhookDeliveryLease,
  updateWebhookDeliveryForLease,
  type WebhookDeliveryLease,
  webhookDeliveryLeaseWhere,
} from "@/lib/webhook-delivery-lease";
import { recordWebhookEndpointOutcome } from "@/lib/webhook-health";
import {
  getWebhookQueueDelaySeconds,
  getWebhookRetryAt,
  MAX_QUEUE_DELAY_SECONDS,
  WebhookDeliveryDeferredError,
  WebhookDeliveryRetryError,
} from "@/lib/webhook-retry";
import type { WebhookMessage } from "@/types/env";

export async function handleWebhookDeliveryQueue(
  batch: MessageBatch<WebhookMessage>
) {
  const db = await createDbClient();
  for (const message of batch.messages) {
    const { deliveryId } = message.body;

    try {
      await processDelivery(db, deliveryId);
      message.ack();
    } catch (error) {
      if (
        error instanceof WebhookDeliveryDeferredError ||
        error instanceof WebhookDeliveryRetryError
      ) {
        const delaySeconds = getWebhookQueueDelaySeconds(error.retryAt);
        if (
          error instanceof WebhookDeliveryDeferredError ||
          error.retryAt.getTime() - Date.now() > MAX_QUEUE_DELAY_SECONDS * 1000
        ) {
          // Waiting is not an HTTP attempt. Fresh messages prevent long
          // cooldowns and early duplicate fan-out from exhausting queue retries.
          // The database retains the full deadline across 24-hour chunks.
          try {
            await env.WEBHOOK_DELIVERY_QUEUE.send(message.body, {
              delaySeconds,
            });
            message.ack();
          } catch (enqueueError) {
            console.error(
              `[Delivery] Failed to defer ${deliveryId}:`,
              enqueueError
            );
            message.retry();
          }
        } else {
          message.retry({ delaySeconds });
        }
        continue;
      }

      console.error(
        `[Delivery] Failed to deliver ${deliveryId}:`,
        error instanceof Error ? error.message : error
      );
      message.retry();
    }
  }
}

async function processDelivery(db: DbClient, deliveryId: string) {
  let lease = await claimWebhookDeliveryAttempt(db, deliveryId);

  if (!lease) {
    return;
  }

  const delivery = await db.query.webhookDelivery.findFirst({
    where: webhookDeliveryLeaseWhere(lease),
    with: {
      event: true,
      webhookEndpoint: {
        columns: {
          format: true,
          secret: true,
          enabled: true,
        },
      },
    },
  });

  if (!delivery) {
    console.error(`[Delivery] Delivery not found: ${deliveryId}`);
    return;
  }

  if (!delivery.webhookEndpoint.enabled && !delivery.isTest) {
    await updateWebhookDeliveryForLease(db, lease, {
      status: "failed",
      failedAt: new Date(),
      nextRetryAt: null,
    });
    return;
  }

  const usage = delivery.isTest
    ? null
    : await checkWebhookUsage(db, delivery.workspaceId);

  if (usage && !usage.allowed) {
    const transition = await updateWebhookDeliveryForLease(db, lease, {
      status: "failed",
      failedAt: new Date(),
      nextRetryAt: null,
    });

    if (transition.count > 0) {
      try {
        await sendWebhookUsageAlert(db, {
          resendApiKey: env.RESEND_API_KEY,
          workspaceId: delivery.workspaceId,
          kind: "exhausted",
          usageAmount: usage.currentUsage,
          limitAmount: usage.limit,
          period: usage.period,
          plan: usage.plan,
        });
      } catch (error) {
        console.error("[Delivery] Failed to send webhook usage alert:", error);
      }
    }

    return;
  }

  const attemptNumber = lease.attemptNumber;

  const payload = buildWebhookPayload(delivery.event);
  const requestBody = buildWebhookRequestBody(
    payload,
    delivery.webhookEndpoint.format
  );

  const body = JSON.stringify(requestBody);
  const signature = await signPayload(body, delivery.webhookEndpoint.secret);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const eventType = serializeEventType(delivery.event.type);

  const renewedLease = await renewWebhookDeliveryLease(db, lease);
  if (!renewedLease) {
    return;
  }
  lease = renewedLease;

  const finishAttempt = (
    data: Parameters<typeof updateWebhookDeliveryForLease>[2],
    success: boolean,
    observedAt: Date
  ) =>
    finishWebhookDeliveryAttempt(db, renewedLease, data, {
      endpointId: delivery.webhookEndpointId,
      url: delivery.url,
      observedAt,
      success,
      isTest: delivery.isTest,
    });

  const startedAt = Date.now();

  let response: Response;

  try {
    response = await fetch(delivery.url, {
      method: "POST",
      signal: AbortSignal.timeout(WEBHOOK_DELIVERY_TIMEOUT_MS),
      headers: {
        "content-type": "application/json",
        "user-agent": "Marble-Webhooks/1.0",
        "x-marble-event": eventType,
        "x-marble-event-id": delivery.event.id,
        "x-marble-delivery-id": delivery.id,
        "x-marble-timestamp": timestamp,
        "x-marble-signature": `sha256=${signature}`,
      },
      body,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    await db.insert(webhookDeliveryAttempt).values({
      id: createRecordId(),
      deliveryId: delivery.id,
      attemptNumber,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      durationMs,
    });

    if (attemptNumber >= delivery.maxAttempts) {
      await finishAttempt(
        {
          status: "failed",
          failedAt: new Date(),
          nextRetryAt: null,
        },
        false,
        new Date()
      );
      return;
    }

    const transition = await finishAttempt(
      {
        status: "retrying",
        nextRetryAt: null,
      },
      false,
      new Date()
    );

    if (transition.count > 0) {
      throw error;
    }

    return;
  }

  const responseReceivedAt = new Date();
  let responseBody: string | undefined;
  let responseError: string | undefined;
  try {
    responseBody = await response.text();
  } catch (error) {
    // Headers still determine acceptance and Retry-After if reading the body
    // times out or the connection closes. Do not bypass a receiver cooldown.
    responseError = `Failed to read webhook response body: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
  const durationMs = Date.now() - startedAt;

  await db.insert(webhookDeliveryAttempt).values({
    id: createRecordId(),
    deliveryId: delivery.id,
    attemptNumber,
    success: response.ok,
    statusCode: response.status,
    responseBody: responseBody?.slice(0, 5000),
    errorMessage: responseError,
    durationMs,
  });

  if (response.ok) {
    const transition = await finishAttempt(
      {
        status: "success",
        deliveredAt: new Date(),
        nextRetryAt: null,
      },
      true,
      responseReceivedAt
    );

    if (transition.count > 0 && !delivery.isTest) {
      try {
        await recordWebhookUsage(db, delivery.workspaceId, delivery.url);

        if (usage?.alertKind) {
          await sendWebhookUsageAlert(db, {
            resendApiKey: env.RESEND_API_KEY,
            workspaceId: delivery.workspaceId,
            kind: usage.alertKind,
            usageAmount: usage.currentUsage + 1,
            limitAmount: usage.limit,
            period: usage.period,
            plan: usage.plan,
          });
        }
      } catch (error) {
        console.error("[Delivery] Failed to track webhook usage:", error);
      }
    }

    return;
  }

  if (attemptNumber >= delivery.maxAttempts) {
    await finishAttempt(
      {
        status: "failed",
        failedAt: new Date(),
        nextRetryAt: null,
      },
      false,
      responseReceivedAt
    );
    return;
  }

  const nextRetryAt = getWebhookRetryAt(
    response,
    attemptNumber,
    responseReceivedAt
  );
  const transition = await finishAttempt(
    {
      status: "retrying",
      nextRetryAt,
    },
    false,
    responseReceivedAt
  );

  if (transition.count > 0) {
    if (nextRetryAt) {
      throw new WebhookDeliveryRetryError(response.status, nextRetryAt);
    }
    throw new Error(`Webhook returned ${response.status}`);
  }
}

async function finishWebhookDeliveryAttempt(
  db: DbClient,
  lease: WebhookDeliveryLease,
  data: Parameters<typeof updateWebhookDeliveryForLease>[2],
  outcome: Parameters<typeof recordWebhookEndpointOutcome>[1]
) {
  return db.transaction(async (tx) => {
    const transition = await updateWebhookDeliveryForLease(tx, lease, data);
    if (transition.count > 0) {
      await recordWebhookEndpointOutcome(tx, outcome);
    }
    return transition;
  });
}
