import type { ApiScope } from "@marble/utils/api-key-scopes";
import type { DbClient } from "@/lib/db";

/**
 * Bindings are inferred from cloudflare.config.ts into
 * `.cloudflare/types/index.d.ts`, which `cf dev` writes and `pnpm cf-typegen`
 * regenerates. Queue message types come from the typed `bindings.queue<T>()`
 * calls there, so do not restate them here.
 *
 * Augmenting `Cloudflare.Env` rather than declaring a separate interface means
 * every route to the environment sees the same type: the `env` handler
 * argument, Hono's `c.env`, and `import { env } from "cloudflare:workers"`.
 *
 * Optional values not declared by the config can be added through namespace
 * augmentation here; required bindings belong in cloudflare.config.ts.
 */
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
