# @marble/api

The dashboard's backend, independent of any transport: oRPC routers, the
context type and the services that hold the business logic. `apps/api` mounts it
at `/rpc` and builds the per-request context; `apps/cms` imports the router
**type** and browser-safe validation helpers. This package never imports from
`apps/*`.

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

## How to move a resource

1. Read the CMS routes, their validation and query helpers, and every caller.
   Port their queries, rules, errors and DTOs into `services/<resource>.ts`
   using the request's `ServiceContext`. Services are dashboard-only in
   MAB-201; leave `/v1` logic alone until MAB-204. Record existing bugs and
   differences instead of fixing them during the port.
2. Put every write through `transact`. Write the same events inside it, with
   `source: "dashboard"` and the resolved actor; register the same resource
   invalidations there. Never call the CMS's event or cache relays. Preserve
   writes that previously emitted no event or invalidation.
3. Add a resource router built from `workspaceProcedure`, with an explicit
   `workspaceId`, `.route({ method, path, tags })`, and DTO output schemas.
   Translate service errors at this boundary. Add it to `routers/index.ts`.
4. Keep page metadata and render a client component. Read filters on the
   client and use `orpc.<resource>.*.queryOptions` / `mutationOptions` with
   `useWorkspace()`'s ID. Invalidate oRPC keys scoped to that ID after writes.
   Remove server fetches, initial data and casted JSON responses, then delete
   the old Next routes and unused helpers. Import shared browser-safe
   validation directly from this package; leave no compatibility exports.
5. Use `@marble/db/testing` and the request/queue helpers in `src/testing.ts`
   for behavior tests: events and transitions, rollback, and workspace
   scoping. Verify with `cf dev` and jobs together, checking outbox stamps,
   fan-out and fresh `/v1` reads. Run package checks and the Worker build;
   compare `/openapi.json` to a capture from before the port.

Posts also expose `posts.fields.list/get` for the new and existing editors;
field definition writes and the settings UI remain Step 5.

Manual webhook tests use `emitEvent({ ..., testWebhookEndpointId })`. Since the
outbox row has no target endpoint, it is marked unsweepable in the transaction
and the targeted `isTest` queue message is awaited after commit. A failed send
returns an error so the user can retry; the sweep must never broadcast it to
subscribers or turn it into a billable delivery. Ordinary events still use the
recoverable outbox. Webhook and API-key CRUD emit no events and clear no server
caches, matching their original CMS handlers.
