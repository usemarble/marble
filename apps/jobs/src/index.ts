import type {
  EventMessage,
  QueueMessage,
  TaskMessage,
  WebhookMessage,
} from "@marble/events";
import { handleWebhookDeliveryQueue } from "@/consumers/deliveries";
import { handleDeadLetterQueue } from "@/consumers/dlq";
import { handleEventQueue } from "@/consumers/events";
import { handleTaskQueue } from "@/consumers/tasks";
import { handleCleanup } from "@/scheduled/cleanup";
import type { Env } from "@/types/env";

export default {
  async fetch() {
    return new Response("Error", { status: 404 });
  },

  async queue(batch: MessageBatch, env: Env, _ctx: ExecutionContext) {
    switch (batch.queue) {
      case "marble-events":
        await handleEventQueue(batch as MessageBatch<EventMessage>, env);
        break;
      case "marble-webhook-deliveries":
        await handleWebhookDeliveryQueue(
          batch as MessageBatch<WebhookMessage>,
          env
        );
        break;
      case "marble-tasks":
        await handleTaskQueue(batch as MessageBatch<TaskMessage>, env);
        break;
      case "marble-dlq":
        await handleDeadLetterQueue(batch as MessageBatch<QueueMessage>, env);
        break;
      default:
        console.error(`[Jobs] Unknown queue: ${batch.queue}`);
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(handleCleanup(event, env, ctx));
  },
};
