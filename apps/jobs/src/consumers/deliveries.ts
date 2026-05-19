import { buildWebhookPayload, serializeEventType } from "@marble/events";
import { createDbClient } from "../lib/db";
import { buildWebhookRequestBody } from "../lib/formats";
import { signPayload } from "../lib/signing";
import {
  checkWebhookUsage,
  recordWebhookUsage,
  sendWebhookUsageAlert,
} from "../lib/usage";
import type { Env } from "../types/env";

const WEBHOOK_DELIVERY_TIMEOUT_MS = 15_000;

interface DeliveryMessage {
  deliveryId: string;
}

export async function handleWebhookDeliveryQueue(
  batch: MessageBatch<DeliveryMessage>,
  env: Env
) {
  const db = createDbClient(env);

  for (const message of batch.messages) {
    const { deliveryId } = message.body;

    try {
      await processDelivery(db, env, deliveryId);
      message.ack();
    } catch (error) {
      console.error(
        `[Delivery] Failed to deliver ${deliveryId}:`,
        error instanceof Error ? error.message : error
      );
      message.retry();
    }
  }
}

async function processDelivery(
  db: ReturnType<typeof createDbClient>,
  env: Env,
  deliveryId: string
) {
  const claim = await db.webhookDelivery.updateMany({
    where: {
      id: deliveryId,
      status: { in: ["pending", "retrying"] },
    },
    data: {
      status: "sending",
      attemptCount: { increment: 1 },
      lastAttemptAt: new Date(),
    },
  });

  if (claim.count === 0) {
    return;
  }

  const delivery = await db.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      event: true,
      webhookEndpoint: {
        select: {
          format: true,
          secret: true,
        },
      },
    },
  });

  if (!delivery) {
    console.error(`[Delivery] Delivery not found: ${deliveryId}`);
    return;
  }

  const usage = delivery.isTest
    ? null
    : await checkWebhookUsage(db, delivery.workspaceId);

  if (usage && !usage.allowed) {
    await sendWebhookUsageAlert(db, {
      resendApiKey: env.RESEND_API_KEY,
      workspaceId: delivery.workspaceId,
      kind: "exhausted",
      usageAmount: usage.currentUsage,
      limitAmount: usage.limit,
      period: usage.period,
    });

    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "failed",
        failedAt: new Date(),
      },
    });
    return;
  }

  const attemptNumber = delivery.attemptCount;

  const payload = buildWebhookPayload(delivery.event);
  const requestBody = buildWebhookRequestBody(
    payload,
    delivery.webhookEndpoint.format
  );

  const body = JSON.stringify(requestBody);
  const signature = await signPayload(body, delivery.webhookEndpoint.secret);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const eventType = serializeEventType(delivery.event.type);
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

    await db.webhookDeliveryAttempt.create({
      data: {
        deliveryId: delivery.id,
        attemptNumber,
        success: false,
        errorMessage: error instanceof Error ? error.message : String(error),
        durationMs,
      },
    });

    if (attemptNumber >= delivery.maxAttempts) {
      await db.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "failed",
          failedAt: new Date(),
        },
      });
      return;
    }

    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: { status: "retrying" },
    });

    throw error;
  }

  const responseBody = await response.text();
  const durationMs = Date.now() - startedAt;

  await db.webhookDeliveryAttempt.create({
    data: {
      deliveryId: delivery.id,
      attemptNumber,
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.slice(0, 5000),
      durationMs,
    },
  });

  if (response.ok && !delivery.isTest) {
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
        });
      }
    } catch (error) {
      console.error("[Delivery] Failed to track webhook usage:", error);
    }
  }

  if (response.ok) {
    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "success",
        deliveredAt: new Date(),
      },
    });
    return;
  }

  if (attemptNumber >= delivery.maxAttempts) {
    await db.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "failed",
        failedAt: new Date(),
      },
    });
    return;
  }

  await db.webhookDelivery.update({
    where: { id: delivery.id },
    data: { status: "retrying" },
  });

  throw new Error(`Webhook returned ${response.status}`);
}
