import {
  apiUrl,
  appUrl,
  baseWorker,
  dataBindings,
  queues,
  resolveMode,
  workerName,
} from "@marble/cf-config";
import type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";
import { bindings, defineConfig, triggers } from "cf/config";
import { CLEANUP_CRON, OUTBOX_SWEEP_CRON } from "./src/crons.ts";

export default defineConfig((ctx) => {
  const mode = resolveMode(ctx.mode);
  const queue = queues(mode);

  const consumer = {
    maxBatchSize: 10,
    maxRetries: 3,
    retryDelay: 60,
    deadLetterQueue: queue.dlq,
  };

  return {
    worker: {
      ...baseWorker,
      name: workerName("marble-jobs", mode),
      triggers: [
        triggers.scheduled({ schedule: CLEANUP_CRON }),
        triggers.scheduled({ schedule: OUTBOX_SWEEP_CRON }),
        triggers.queue({ ...consumer, name: queue.events }),
        triggers.queue({ ...consumer, name: queue.webhookDeliveries }),
        triggers.queue({ ...consumer, name: queue.tasks, maxBatchSize: 1 }),
        triggers.queue({
          name: queue.dlq,
          maxBatchSize: 10,
          maxRetries: 1,
          retryDelay: 60,
        }),
      ],
      env: {
        ...dataBindings(mode),
        EVENT_QUEUE: bindings.queue<EventMessage>({ name: queue.events }),
        WEBHOOK_DELIVERY_QUEUE: bindings.queue<WebhookMessage>({
          name: queue.webhookDeliveries,
        }),
        TASK_QUEUE: bindings.queue<TaskMessage>({ name: queue.tasks }),
        // Queue names differ per mode (marble-events-staging, ...), so the
        // consumer dispatches on these rather than on literals.
        QUEUE_EVENTS: bindings.text(queue.events),
        QUEUE_WEBHOOK_DELIVERIES: bindings.text(queue.webhookDeliveries),
        QUEUE_TASKS: bindings.text(queue.tasks),
        QUEUE_DLQ: bindings.text(queue.dlq),
        APP_URL: bindings.text(appUrl(mode)),
        API_URL: bindings.text(apiUrl(mode)),
        RESEND_API_KEY: bindings.secret(),
      },
    },
  };
});
