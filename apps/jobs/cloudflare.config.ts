import {
  baseWorker,
  dataBindings,
  queues,
  resolveMode,
  workerName,
} from "@marble/cf-config";
import type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";
import { bindings, defineConfig, triggers } from "cf/config";

const consumer = {
  maxBatchSize: 10,
  maxRetries: 3,
  retryDelay: 60,
  deadLetterQueue: queues.dlq,
};

export default defineConfig((ctx) => {
  const mode = resolveMode(ctx.mode);

  return {
    worker: {
      ...baseWorker,
      name: workerName("marble-jobs", mode),
      triggers: [
        triggers.scheduled({ schedule: "0 * * * *" }),
        triggers.queue({ ...consumer, name: queues.events }),
        triggers.queue({ ...consumer, name: queues.webhookDeliveries }),
        triggers.queue({ ...consumer, name: queues.tasks, maxBatchSize: 1 }),
        triggers.queue({
          name: queues.dlq,
          maxBatchSize: 10,
          maxRetries: 1,
          retryDelay: 60,
        }),
      ],
      env: {
        ...dataBindings(mode),
        EVENT_QUEUE: bindings.queue<EventMessage>({ name: queues.events }),
        WEBHOOK_DELIVERY_QUEUE: bindings.queue<WebhookMessage>({
          name: queues.webhookDeliveries,
        }),
        TASK_QUEUE: bindings.queue<TaskMessage>({ name: queues.tasks }),
        APP_URL: bindings.text(
          mode === "dev" ? "http://localhost:3000" : "https://app.marblecms.com"
        ),
        RESEND_API_KEY: bindings.secret(),
      },
    },
  };
});
