import type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";

export type Env = Omit<
  CloudflareBindings,
  "EVENT_QUEUE" | "WEBHOOK_DELIVERY_QUEUE" | "TASK_QUEUE"
> & {
  EVENT_QUEUE: Queue<EventMessage>;
  WEBHOOK_DELIVERY_QUEUE: Queue<WebhookMessage>;
  TASK_QUEUE: Queue<TaskMessage>;
  APP_URL?: string;
};

// Re-exported so consumers can keep importing message contracts from the local
// env module; the source of truth is @marble/events.
export type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";
