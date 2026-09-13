import type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";

/**
 * Bindings and vars are generated into `worker-configuration.d.ts` by
 * `pnpm cf-typegen`, from wrangler.jsonc plus .env.example. Do not restate them
 * here — re-run that script after changing either file.
 *
 * Augmenting `Cloudflare.Env` rather than declaring a separate interface means
 * every route to the environment sees the same type: the `env` handler
 * argument, Hono's `c.env`, and `import { env } from "cloudflare:workers"`.
 * A standalone interface would only type the first two, leaving the import on
 * the raw generated shape.
 *
 * Only declare what Wrangler cannot infer:
 *   - queue message contracts, which generate as an untyped `Queue`
 *   - vars configured in the Cloudflare dashboard rather than in wrangler.jsonc
 */
declare global {
  // biome-ignore lint/style/noNamespace: declaration merging into Cloudflare.Env requires the ambient namespace; there is no module form.
  namespace Cloudflare {
    interface Env {
      EVENT_QUEUE: Queue<EventMessage>;
      WEBHOOK_DELIVERY_QUEUE: Queue<WebhookMessage>;
      TASK_QUEUE: Queue<TaskMessage>;
      APP_URL?: string;
    }
  }
}

export type Env = Cloudflare.Env;

// Re-exported so consumers can keep importing message contracts from the local
// env module; the source of truth is @marble/events.
export type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";
