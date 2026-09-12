import type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";

/**
 * Bindings and vars are generated into `worker-configuration.d.ts` by
 * `pnpm cf-typegen`, from wrangler.jsonc plus .env.example. Do not restate them
 * here — re-run that script after changing either file.
 *
 * This interface only adds what Wrangler cannot infer:
 *   - queue message contracts, which generate as an untyped `Queue`
 *   - vars configured in the Cloudflare dashboard rather than in wrangler.jsonc
 */
export interface Env extends CloudflareBindings {
  EVENT_QUEUE: Queue<EventMessage>;
  WEBHOOK_DELIVERY_QUEUE: Queue<WebhookMessage>;
  TASK_QUEUE: Queue<TaskMessage>;
  APP_URL?: string;
}

// Re-exported so consumers can keep importing message contracts from the local
// env module; the source of truth is @marble/events.
export type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";
