import { createRecordId } from "@marble/db/id";
import {
  webhookDelivery,
  webhookEndpoint,
  workspaceEvent,
} from "@marble/db/schema";
import { and, arrayContains, eq } from "drizzle-orm";
import { closeDbClient, createDbClient } from "@/lib/db";
import type { Env, EventMessage } from "@/types/env";

export async function handleEventQueue(
  batch: MessageBatch<EventMessage>,
  env: Env
) {
  const db = await createDbClient(env);
  try {
    for (const message of batch.messages) {
      const { eventId, targetWebhookEndpointId, isTest = false } = message.body;

      try {
        const event = await db.query.workspaceEvent.findFirst({
          where: eq(workspaceEvent.id, eventId),
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

        const webhookFilters = [
          eq(webhookEndpoint.workspaceId, event.workspaceId),
        ];

        if (targetWebhookEndpointId) {
          webhookFilters.push(eq(webhookEndpoint.id, targetWebhookEndpointId));
        } else {
          webhookFilters.push(eq(webhookEndpoint.enabled, true));
          webhookFilters.push(
            arrayContains(webhookEndpoint.events, [event.type])
          );
        }

        const webhooks = await db.query.webhookEndpoint.findMany({
          where: and(...webhookFilters),
        });

        if (webhooks.length === 0) {
          await db
            .update(workspaceEvent)
            .set({ processedAt: new Date() })
            .where(eq(workspaceEvent.id, event.id));
          message.ack();
          continue;
        }

        for (const webhook of webhooks) {
          const inserted = await db
            .insert(webhookDelivery)
            .values({
              id: createRecordId(),
              eventId: event.id,
              workspaceId: event.workspaceId,
              webhookEndpointId: webhook.id,
              url: webhook.url,
              status: "pending",
              isTest,
            })
            .onConflictDoNothing({
              target: [
                webhookDelivery.eventId,
                webhookDelivery.webhookEndpointId,
              ],
            })
            .returning({ id: webhookDelivery.id });

          const delivery =
            inserted[0] ??
            (await db.query.webhookDelivery.findFirst({
              where: and(
                eq(webhookDelivery.eventId, event.id),
                eq(webhookDelivery.webhookEndpointId, webhook.id)
              ),
              columns: { id: true },
            }));

          if (!delivery) {
            throw new Error(
              `Failed to upsert webhook delivery for event ${event.id}`
            );
          }

          await env.WEBHOOK_DELIVERY_QUEUE.send({
            type: "webhook.delivery",
            deliveryId: delivery.id,
          });
        }

        await db
          .update(workspaceEvent)
          .set({ processedAt: new Date() })
          .where(eq(workspaceEvent.id, event.id));

        message.ack();
      } catch (error) {
        console.error(`[Events] Failed to process event ${eventId}:`, error);
        message.retry();
      }
    }
  } finally {
    await closeDbClient(db);
  }
}
