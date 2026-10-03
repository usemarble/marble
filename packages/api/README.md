# @marble/api

The dashboard's backend, independent of any transport: oRPC routers, the
context type and the services that hold the business logic. `apps/api` mounts it
at `/rpc` and builds the per-request context; `apps/cms` imports only the router
**type**. This package never imports from `apps/*`.

```
src/context.ts      ServiceContext and Context (types only)
src/index.ts        procedure builders: publicProcedure, protectedProcedure, workspaceProcedure
src/routers/        one file per resource, assembled in routers/index.ts
src/services/       business logic; takes a ServiceContext, never a Hono `c`
src/lib/            cache helper, transact()
```

## Rules

- A service takes `ctx` (`db`, `log`, `env`, `queues`, `defer`) and returns data
  or throws. If it takes a Hono `c` or returns a `Response`, it belongs in
  `apps/api`.
- Don't call `auth.api.*` in a service. Auth is resolved before the context is
  built; services receive the resolved user and workspace.
- Map rows to DTOs in the procedure's `.output()` schema instead of returning
  rows with private columns.
- Don't close `ctx.db`. It is the request's Hyperdrive client and `defer`red work
  reuses it.
- Work that runs after the response (`defer`) must not use `ctx.log`, which is
  sealed by then. Log through `import { log } from "evlog"`.

## Workspace procedures

Every workspace-scoped procedure takes `workspaceId` (the ID, not the slug) in
its input and is built from `workspaceProcedure`, which checks the caller's
membership of **that** workspace and puts `{ workspaceId, role }` on the
context. It never reads the session's active organization. Membership and plan
lookups are cached in Redis for 60 seconds and cleared by `@marble/auth` when
members or subscriptions change.

Declare `.route({ method, path, tags })` on every procedure so the dev-only
reference at `/internal/reference` reads like REST
(`/workspaces/{workspaceId}/posts`).

## Writes: `transact`

A service that writes goes through `transact(ctx, async ({ tx, emitEvent, invalidate }) => ...)`:

- `emitEvent` writes the `workspace_event` row inside the transaction (the
  outbox), so it exists if and only if the write commits.
- After the commit, `transact` sends the queue message and clears the cache
  through `ctx.defer`. A rollback does neither.
- `invalidate(workspaceId, resource)` also clears the resources that embed it
  (`services/cache.ts` has the rules).

If the queue send fails or the Worker is recycled first, the row stays without
an `enqueuedAt` and `sweepEvents` re-sends it from the jobs Worker's cron.
Delivery is at-least-once; the fan-out consumer is idempotent.

## Tests

`pnpm --filter @marble/api test` needs the root `docker compose up -d` (Postgres
and the Redis HTTP proxy). Each test file migrates its own throwaway database
with `@marble/db/testing`.
