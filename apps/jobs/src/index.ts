import { env } from "cloudflare:workers";
import type {
  EventMessage,
  QueueMessage,
  TaskMessage,
  WebhookMessage,
} from "@marble/events";
import { initWorkersLogger } from "evlog/workers";
import { handleWebhookDeliveryQueue } from "@/consumers/deliveries";
import { handleDeadLetterQueue } from "@/consumers/dlq";
import { handleEventQueue } from "@/consumers/events";
import { handleTaskQueue } from "@/consumers/tasks";
import { CLEANUP_CRON, OUTBOX_SWEEP_CRON } from "@/crons";
import { handleCleanup } from "@/scheduled/cleanup";
import { handleOutboxSweep } from "@/scheduled/outbox";
import type { Env } from "@/types/env";

// Services shared with the API log through evlog.
initWorkersLogger({
  env: {
    service: "marble-jobs",
    environment: process.env.MODE ?? "production",
  },
});

export default {
  async fetch() {
    return new Response("Error", { status: 404 });
  },

  async queue(batch: MessageBatch) {
    switch (batch.queue) {
      case env.QUEUE_EVENTS:
        await handleEventQueue(batch as MessageBatch<EventMessage>);
        break;
      case env.QUEUE_WEBHOOK_DELIVERIES:
        await handleWebhookDeliveryQueue(batch as MessageBatch<WebhookMessage>);
        break;
      case env.QUEUE_TASKS:
        await handleTaskQueue(batch as MessageBatch<TaskMessage>);
        break;
      case env.QUEUE_DLQ:
        await handleDeadLetterQueue(batch as MessageBatch<QueueMessage>);
        break;
      default:
        console.error(`[Jobs] Unknown queue: ${batch.queue}`);
    }
  },

  scheduled(event: ScheduledEvent, _env: Env, ctx: ExecutionContext) {
    switch (event.cron) {
      case CLEANUP_CRON:
        ctx.waitUntil(handleCleanup());
        break;
      case OUTBOX_SWEEP_CRON:
        ctx.waitUntil(handleOutboxSweep());
        break;
      default:
        console.error(`[Jobs] Unknown cron: ${event.cron}`);
    }
  },
};
