import type { EventMessage, TaskMessage } from "@marble/events";
import type { ApiScope } from "@marble/utils/api-key-scopes";
import type { DbClient } from "@/lib/db";

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
  TASK_QUEUE: Queue<TaskMessage>;
  STORAGE_PUBLIC_URL?: string;
}

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
