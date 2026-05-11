import { createDbClient } from "../lib/db";
import type { Env } from "../types/env";

interface EventMessage {
  eventId: string;
}

export async function handleEventQueue(
  batch: MessageBatch<EventMessage>,
  env: Env
) {
  const db = createDbClient(env);

  for (const message of batch.messages) {
    const { eventId } = message.body;

    try {
      const event = await db.workspaceEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        console.error(`[Events] Event not found: ${eventId}`);
        message.ack();
        continue;
      }

      const webhooks = await db.webhook.findMany({
        where: {
          workspaceId: event.workspaceId,
          enabled: true,
          events: { has: event.type },
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
        const delivery = await db.webhookDelivery.create({
          data: {
            eventId: event.id,
            workspaceId: event.workspaceId,
            webhookEndpointId: webhook.id,
            url: webhook.endpoint,
            status: "pending",
          },
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
