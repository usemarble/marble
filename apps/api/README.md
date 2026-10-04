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

## AI

`POST /ai/chat` streams the dashboard assistant's answers (the AI SDK's UI
message stream, which isn't an RPC response, so it is a plain Hono route with
the same credentialed CORS and request context as `/rpc`). Body:
`{ workspaceId, messages }`. Before any model call it checks, in order, a
verified session (401), membership of the workspace (403), a paid plan with the
`aiAssistant` action (403) and a per-user Upstash limit of 10 a minute and 100 a
day (429 with `Retry-After`). `ai.suggestions` (readability) is an ordinary
`/rpc` procedure. Both use `@marble/api/ai/model`, the one place that names a
provider and model; `AI_GATEWAY_API_KEY` is a Worker secret declared in
`cloudflare.config.ts`.

Locally, `cf dev` needs the docker-compose Postgres and Redis and a `.dev.vars`
(or `.env`) with the secrets declared in `cloudflare.config.ts`; point
`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`, `REDIS_URL` and
`REDIS_TOKEN` at them as in `.env.example`.

