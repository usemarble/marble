/**
 * Bindings are inferred from cloudflare.config.ts into
 * `.cloudflare/types/index.d.ts`, which `cf dev` writes and `pnpm cf-typegen`
 * regenerates. Queue message types come from the typed `bindings.queue<T>()`
 * calls there, so nothing needs restating here.
 */
export type Env = Cloudflare.Env;

// Re-exported so consumers can keep importing message contracts from the local
// env module; the source of truth is @marble/events.
export type { EventMessage, TaskMessage, WebhookMessage } from "@marble/events";
