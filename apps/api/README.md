# API

API endpoints users can fetch data from.

## Local Development

```txt
pnpm --filter api dev
```

This runs the Worker at `http://localhost:8787` through `cf dev --mode dev`.
Hyperdrive connects to `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`
from `.env`, `STORAGE` uses the remote `marbledev` R2 bucket, and Polar calls
go to the sandbox.

To run the jobs Worker in the same session, so messages sent to
`marble-events` and `marble-tasks` are consumed locally, run from the repo root:

```txt
pnpm workers:dev
```

`cf dev` writes the binding types to `.cloudflare/types`. Regenerate them after
changing `cloudflare.config.ts` without running the dev server:

```txt
pnpm --filter api cf-typegen
```

Deploy:

```txt
pnpm --filter api run deploy
```

## Dashboard router (`/rpc`)

The dashboard's backend lives in `@marble/api`; this Worker mounts it at
`/rpc/*` (credentialed CORS for `APP_URL`, plus oRPC's CSRF header check). The
context is built per request from the Hyperdrive client and a `createAuth`
session lookup, which only `/rpc` (and later `/ai`) pays for; `/v1` is tagged
from what API-key auth already resolved. Every request emits one evlog wide
event.

In `cf dev` (`MODE=dev`) the router's OpenAPI reference is served at
`/internal/reference` (spec at `/internal/openapi.json`). It is never mounted in
staging or production.

Locally, `cf dev` needs the docker-compose Postgres and Redis and a `.dev.vars`
(or `.env`) with the secrets declared in `cloudflare.config.ts`; point
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`, `REDIS_URL` and
`REDIS_TOKEN` at them as in `.env.example`.

