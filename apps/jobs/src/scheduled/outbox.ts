import { env } from "cloudflare:workers";
import { sweepEvents } from "@marble/api/services/events";
import { createDbClient } from "@/lib/db";

const BATCH_SIZE = 100;
const MAX_BATCHES = 10;

/**
 * Re-sends workspace events whose queue message was never sent. See
 * `sweepEvents` in @marble/api for what counts as stranded.
 */
export async function handleOutboxSweep() {
  const db = await createDbClient();
  let total = 0;

  for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
    const enqueued = await sweepEvents(
      { db, queue: env.EVENT_QUEUE },
      { limit: BATCH_SIZE }
    );
    total += enqueued;
    if (enqueued < BATCH_SIZE) {
      break;
    }
  }

  if (total > 0) {
    console.warn(
      `[Outbox] Re-enqueued ${total} event(s) that never reached the queue`
    );
  }
}
