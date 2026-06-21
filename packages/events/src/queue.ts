/**
 * Contracts for every message that flows through Marble's Cloudflare Queues.
 *
 * Every message carries a dotted `type` discriminant so consumers (and the
 * shared dead-letter queue) can route purely by `body.type` — no field-presence
 * guessing. Producers live in apps/api; consumers live in apps/jobs.
 */

/** marble-events: a workspace event to fan out to subscribed webhooks. */
export interface EventMessage {
  type: "event.fanout";
  eventId: string;
  targetWebhookEndpointId?: string;
  isTest?: boolean;
}

/** marble-webhook-deliveries: a single webhook delivery attempt. */
export interface WebhookMessage {
  type: "webhook.delivery";
  deliveryId: string;
}

/**
 * marble-tasks: heavy user-requested jobs (export / import).
 * Import runs in two phases around a human review pause: `import.process`
 * parses into ImportItems for review; `import.create` turns confirmed items
 * into draft posts.
 */
export type TaskMessage =
  | { type: "export.process"; jobId: string }
  | { type: "import.process"; jobId: string }
  | { type: "import.create"; jobId: string };

/** Any message that can land in the shared `marble-dlq`. */
export type QueueMessage = EventMessage | WebhookMessage | TaskMessage;
