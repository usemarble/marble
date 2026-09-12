/**
 * Bindings and vars are generated into `worker-configuration.d.ts` by
 * `pnpm cf-typegen`, from wrangler.jsonc plus .env.example. Do not restate them
 * here — re-run that script after changing either file.
 */
export type Env = CloudflareBindings;

export type QueryParams = Record<
  string,
  boolean | number | string | string[] | undefined
>;
