/**
 * The bindings packages/api reads. The Worker passes its generated
 * `Cloudflare.Env`, which satisfies this structurally; it is declared here
 * because the generated type lives in apps/api and a package can't import it.
 */
export interface ApiEnv {
  REDIS_URL: string;
  REDIS_TOKEN: string;
}
