import type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";

export interface Env {
  HYPERDRIVE: { connectionString: string };
  EVENT_QUEUE: Queue<EventMessage>;
  WEBHOOK_DELIVERY_QUEUE: Queue<WebhookMessage>;
  TASK_QUEUE: Queue<TaskMessage>;
  STORAGE: R2Bucket;
  RESEND_API_KEY: string;
  APP_URL?: string;
}

// Re-exported so consumers can keep importing message contracts from the local
// env module; the source of truth is @marble/events.
export type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";
