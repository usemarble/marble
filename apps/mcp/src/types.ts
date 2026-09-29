/**
 * Bindings are inferred from cloudflare.config.ts into
 * `.cloudflare/types/index.d.ts`, which `cf dev` writes and `pnpm cf-typegen`
 * regenerates. Do not restate them here.
 *
 * Aliased to `Cloudflare.Env` so the handler argument, Hono's `c.env` and
 * `import { env } from "cloudflare:workers"` all resolve to one type, matching
 * api and jobs. There is nothing to augment here: mcp has no bindings, so the
 * generated shape is already complete.
 */
export type Env = Cloudflare.Env;

export type QueryParams = Record<
  string,
  boolean | number | string | string[] | undefined
>;
