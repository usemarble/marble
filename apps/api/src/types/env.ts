import type { EventMessage, TaskMessage } from "@marble/events";
import type { ApiScope } from "@marble/utils/api-key-scopes";
import type { DbClient } from "@/lib/db";

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
      TASK_QUEUE: Queue<TaskMessage>;
      STORAGE_PUBLIC_URL?: string;
    }
  }
}

export type Env = Cloudflare.Env;

// Context variables set by keyAuthorization middleware
export interface ApiKeyVariables {
  db: DbClient;
  workspaceId?: string;
  apiKeyId?: string;
  apiKeyType?: "public" | "private";
  apiKeyScopes?: ApiScope[];
}

// Hono app type for API key authenticated routes
export interface ApiKeyApp {
  Bindings: Env;
  Variables: ApiKeyVariables;
}
