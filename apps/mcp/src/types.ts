/**
 * Bindings and vars are generated into `worker-configuration.d.ts` by
 * `pnpm cf-typegen`, from wrangler.jsonc plus .env.example. Do not restate them
 * here — re-run that script after changing either file.
 *
 * Aliased to `Cloudflare.Env` so the handler argument, Hono's `c.env` and
 * `import { env } from "cloudflare:workers"` all resolve to one type, matching
 * api and jobs. There is nothing to augment here: mcp has no queue bindings and
 * no dashboard-only vars, so the generated shape is already complete.
 */
export type Env = Cloudflare.Env;

export type QueryParams = Record<
  string,
  boolean | number | string | string[] | undefined
>;
