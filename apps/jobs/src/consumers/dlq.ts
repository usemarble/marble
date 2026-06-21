import type { QueueMessage } from "@marble/events";
import { createDbClient } from "@/lib/db";
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
  const db = createDbClient(env);

  for (const message of batch.messages) {
    const body = message.body;

    try {
      switch (body.type) {
        case "webhook.delivery":
          await db.webhookDelivery.update({
            where: { id: body.deliveryId },
            data: { status: "failed", failedAt: new Date() },
          });
          console.error(
            `[DLQ] Marked delivery as permanently failed: ${body.deliveryId}`
          );
          break;
        case "export.process":
          await db.exportJob.update({
            where: { id: body.jobId },
            data: { status: "failed", failedAt: new Date() },
          });
          console.error(
            `[DLQ] Marked export as permanently failed: ${body.jobId}`
          );
          break;
        case "import.process":
        case "import.create":
          await db.importJob.update({
            where: { id: body.jobId },
            data: { status: "failed", failedAt: new Date() },
          });
          console.error(
            `[DLQ] Marked import as permanently failed: ${body.jobId}`
          );
          break;
        case "event.fanout":
          // WorkspaceEvent has no failure state — log only.
          console.error(
            `[DLQ] Event fanout permanently failed: ${body.eventId}`
          );
          break;
        default:
          console.error("[DLQ] Unknown message type:", JSON.stringify(body));
      }

      message.ack();
    } catch (error) {
      console.error("[DLQ] Failed to process DLQ message:", error);
      // Already dead-lettered — never retry it.
      message.ack();
    }
  }
}
