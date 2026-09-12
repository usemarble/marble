# @marble/db

Schema, migrations, and database clients for Marble.

## Ownership

**Drizzle Kit owns the schema.** `src/schema/` is the source of truth: change the
TypeScript, generate a migration, commit both.

This database was created and evolved under Prisma until the Drizzle cutover.
That history is kept as a read-only record in [`archive/prisma/`](./archive/prisma)
— it documents how production got its current shape and is **never executed**.
Do not run `prisma migrate` against any shared environment.

## Runtime clients

Two clients, because the two runtimes need different drivers. Pick by consumer,
not by preference.

| Consumer | Import | Driver | Connection source |
| --- | --- | --- | --- |
| `apps/cms` (Next.js) | `@marble/db` → `db` | neon-serverless over WebSocket, pooled | `DATABASE_URL` |
| `apps/api`, `apps/jobs` (Workers) | `@marble/db/hyperdrive` → `createHyperdriveClient()` | `pg.Client`, one per invocation | Cloudflare `HYPERDRIVE` binding |

The CMS client is a long-lived pool created once per process. The Hyperdrive
client is **not** — it opens a dedicated socket per call, so every
`createHyperdriveClient` must be paired with `closeHyperdriveClient` in a
`finally`, including on error paths. Both apps wrap this as `closeDbClient` in
their own `lib/db.ts`. Skipping the close leaks connections until the isolate is
torn down and eventually exhausts Hyperdrive's connection capacity.

## Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | CMS runtime | Pooled connection string (`-pooler` host). |
| `DIRECT_URL` | Drizzle Kit only | Direct, non-pooled connection. Migrations need a session-level connection, which a transaction pooler cannot give. |

`drizzle.config.ts` resolves `DIRECT_URL ?? DATABASE_URL`, so set `DIRECT_URL`
wherever migrations run. `apps/api` and `apps/jobs` use neither — Cloudflare
supplies their connection string through the `HYPERDRIVE` binding.

## Commands

Run these from the repo root; the root aliases set the working directory for
you.

```bash
pnpm db:generate   # diff src/schema against the last snapshot, emit a migration
pnpm db:migrate    # apply pending migrations
pnpm db:studio     # browse the database
pnpm db:pull       # introspect a database into a Drizzle schema (inspection only)
```

Invoking `drizzle-kit` directly only works with `packages/db` as the working
directory — `out: "./drizzle"` in the config is relative to the cwd, so running
it from elsewhere silently targets an empty migration folder.

`pnpm db:push` exists but applies schema diffs without a migration file. Local
throwaway databases only; never a shared environment.

## Changing the schema

1. Edit `src/schema/`.
2. `pnpm db:generate` — writes `drizzle/NNNN_name.sql` plus a snapshot under `drizzle/meta/`.
3. Read the generated SQL. Drizzle emits foreign keys before indexes, which is
   wrong for any composite key that references a unique *index* rather than a
   table constraint (see the baseline note below).
4. Commit the schema change, the `.sql`, and the `meta/` updates together.

Migrations are applied at deploy time — the Vercel build runs `pnpm db:migrate`
before building the CMS — so a merged migration reaches production on the next
deploy.

### Do not edit an applied migration

`drizzle-kit migrate` decides what to run by comparing each journal entry's
`when` timestamp against the newest `created_at` in `drizzle.__drizzle_migrations`.
It records each migration's hash but never verifies it. So re-dating or
reordering journal entries can re-run applied SQL, while editing the SQL of an
already-applied migration silently does nothing. Add a new migration instead.

## How the baseline was established

`0000_init.sql` is generated from `src/schema`, but differs from raw
`drizzle-kit generate` output in two deliberate ways.

**Every statement is idempotent** — guarded `CREATE TYPE` and `ADD CONSTRAINT`,
`IF NOT EXISTS` everywhere else. One migration therefore covers both cases:

- an **empty** database gets the full schema;
- a database that already carries the Prisma-era schema executes 190 no-ops and
  simply records the migration, which is what baselines it.

No manual baselining step is needed for an existing database, and the whole
migration runs in a single transaction, so it either fully applies or rolls back.

**Unique indexes are created before foreign keys.** The composite keys on
`post`, `field`, and `import_job` reference unique indexes rather than table
constraints, and Postgres requires the index to exist first. In generate order
a fresh database fails on `import_item_importJobId_workspaceId_fkey`.

Both paths were verified against real databases: an empty one, where the result
matched a production clone exactly on indexes, constraints, and enums; and a
clone of production carrying real data, where every statement was a no-op and
all row counts were unchanged.
