import { createDbClient } from "../lib/db";
import type { Env } from "../types/env";

interface EventMessage {
  eventId: string;
  targetWebhookEndpointId?: string;
  isTest?: boolean;
}

export async function handleEventQueue(
  batch: MessageBatch<EventMessage>,
  env: Env
) {
  const db = createDbClient(env);

  for (const message of batch.messages) {
    const { eventId, targetWebhookEndpointId, isTest = false } = message.body;

    try {
      const event = await db.workspaceEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        console.error(`[Events] Event not found: ${eventId}`);
        message.retry();
        continue;
      }

      if (event.processedAt) {
        message.ack();
        continue;
      }

      const webhooks = await db.webhookEndpoint.findMany({
        where: {
          ...(targetWebhookEndpointId && { id: targetWebhookEndpointId }),
          workspaceId: event.workspaceId,
          ...(targetWebhookEndpointId ? {} : { enabled: true }),
          ...(targetWebhookEndpointId ? {} : { events: { has: event.type } }),
        },
      });

      if (webhooks.length === 0) {
        await db.workspaceEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date() },
        });
        message.ack();
        continue;
      }

      for (const webhook of webhooks) {
        const delivery = await db.webhookDelivery.upsert({
          where: {
            eventId_webhookEndpointId: {
              eventId: event.id,
              webhookEndpointId: webhook.id,
            },
          },
          create: {
            eventId: event.id,
            workspaceId: event.workspaceId,
            webhookEndpointId: webhook.id,
            url: webhook.url,
            status: "pending",
            isTest,
          },
          update: {},
        });

        await env.WEBHOOK_DELIVERY_QUEUE.send({
          deliveryId: delivery.id,
        });
      }

      await db.workspaceEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      });

      message.ack();
    } catch (error) {
      console.error(`[Events] Failed to process event ${eventId}:`, error);
      message.retry();
    }
  }
}
