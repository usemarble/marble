import { createDbClient } from "../lib/db";
import type { Env } from "../types/env";

interface DlqMessage {
  eventId?: string;
  deliveryId?: string;
}

export async function handleDeadLetterQueue(
  batch: MessageBatch<DlqMessage>,
  env: Env
) {
  const db = createDbClient(env);

  for (const message of batch.messages) {
    const { deliveryId } = message.body;

    try {
      if (deliveryId) {
        await db.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: "failed",
            failedAt: new Date(),
          },
        });
        console.error(
          `[DLQ] Marked delivery as permanently failed: ${deliveryId}`
        );
      } else {
        console.error(
          "[DLQ] Message permanently failed (no deliveryId):",
          JSON.stringify(message.body)
        );
      }

      message.ack();
    } catch (error) {
      console.error("[DLQ] Failed to process DLQ message:", error);
      message.ack();
    }
  }
}
