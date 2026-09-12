import { exportJob, importJob, webhookDelivery } from "@marble/db/schema";
import type { QueueMessage } from "@marble/events";
import { eq } from "drizzle-orm";
import { closeDbClient, createDbClient } from "@/lib/db";
import type { Env } from "@/types/env";

/**
 * Single consumer for the shared `marble-dlq`. The DLQ receives the original
 * message verbatim from whichever source queue dead-lettered it, and
 * `batch.queue` is always "marble-dlq" — so we route purely on `body.type`.
 *
 * Its only job is to terminate: mark the relevant record permanently failed
 * (events have no failure state, so they're logged only). Always acks — a
 * dead-lettered message must never retry.
 */
export async function handleDeadLetterQueue(
  batch: MessageBatch<QueueMessage>,
  env: Env
) {
  const db = await createDbClient(env);
  try {
    for (const message of batch.messages) {
      const body = message.body;

      try {
        switch (body.type) {
          case "webhook.delivery":
            await db
              .update(webhookDelivery)
              .set({ status: "failed", failedAt: new Date() })
              .where(eq(webhookDelivery.id, body.deliveryId));
            console.error(
              `[DLQ] [${body.type}] marked delivery as permanently failed: ${body.deliveryId}`
            );
            break;
          case "export.process":
            await db
              .update(exportJob)
              .set({ status: "failed", failedAt: new Date() })
              .where(eq(exportJob.id, body.jobId));
            console.error(
              `[DLQ] [${body.type}] marked export as permanently failed: ${body.jobId}`
            );
            break;
          case "import.process":
            await db
              .update(importJob)
              .set({ status: "failed", failedAt: new Date() })
              .where(eq(importJob.id, body.jobId));
            console.error(
              `[DLQ] type=${body.type} marked import as permanently failed: ${body.jobId}`
            );
            break;
          case "event.fanout":
            // WorkspaceEvent has no failure state — log only.
            console.error(
              `[DLQ] [${body.type}] event fanout permanently failed: ${body.eventId}`
            );
            break;
          default:
            console.error("[DLQ] Unknown message type:", JSON.stringify(body));
        }

        message.ack();
      } catch (error) {
        console.error(
          `[DLQ] Failed to process message type=${body.type}:`,
          error
        );
        message.ack();
      }
    }
  } finally {
    await closeDbClient(db);
  }
}
