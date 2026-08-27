# PR2 — API + Jobs Hyperdrive Prisma → Drizzle

Working title for the second migration PR: **`apps/api` + `apps/jobs` on Drizzle via Hyperdrive**.

This document summarizes PR2 prerequisites, scope, client factory changes, parity checks, exit criteria, and out-of-scope items. It assumes PR1 (CMS + `@marble/drizzle` foundation) is already merged.

Index: [`README.md`](./README.md).

---

## Prerequisites

PR2 **must not start** until:

1. **PR1 is merged** — `@marble/drizzle` exists with shared schema modules; CMS is off Prisma for app queries + Better Auth; Phase 0 baseline / schema-check remain green.
2. Staging has completed a CMS auth soak (sessions + org flows) without requiring Redis flushes.
3. Prisma still owns migrations (`packages/db`); no Drizzle Kit migrate against production yet.

Prisma stays installed through PR2 for rollback and until PR3 removes it.

---

## Goal

Cut over Cloudflare Workers apps (`apps/api`, `apps/jobs`) from Prisma Hyperdrive clients to **Drizzle + node-postgres (`pg`) via Hyperdrive**, on the **same Neon Postgres database**:

- No data migration, dual-writes, or physical table renames
- Reuse `@marble/drizzle` schema from PR1
- Preserve Hyperdrive connection pooling (use Hyperdrive `connectionString` with a `pg`-compatible Drizzle driver)
- Keep HTTP/JSON and job side-effects identical
- Agent-runnable parity for public API reads/writes and critical job paths

**Not a goal of PR2:** removing Prisma / `@marble/db`, handing schema ownership to Drizzle Kit, Redis query cache, or CMS driver changes.

---

## Scope

### In scope

| Area | Detail |
| --- | --- |
| `apps/api` | Replace Prisma Hyperdrive client factory; migrate all `@marble/db` / `@marble/db/workers` / `@marble/db/hyperdrive` runtime usage to `@marble/drizzle` |
| `apps/jobs` | Same Hyperdrive → Drizzle `pg` cutover for import / webhook / pipeline DB access |
| Client factories | Rewrite `apps/api/src/lib/db.ts` and `apps/jobs/src/lib/db.ts` (see below) |
| Package export | Ensure `@marble/drizzle` exports a Hyperdrive-friendly factory (e.g. `drizzle-orm/node-postgres` + `pg.Pool` / Client wired to `env.HYPERDRIVE.connectionString`) |
| Parity | API golden paths (incl. API key auth), jobs smoke for import/webhook persistence |
| Docs | This PR2 brief; update inventory notes for api/jobs if useful |

### Out of scope (explicit)

| Item | Why deferred |
| --- | --- |
| **Removing `@marble/db` / Prisma** | PR3 — only after cms + api + jobs have **zero** runtime Prisma imports |
| **Drizzle Kit as schema owner** | PR3 handoff |
| **Redis / Drizzle query cache** | Post-v1 polish |
| **CMS neon-http experiments** | CMS stays on neon-serverless WS from PR1 |
| **Schema redesign / table renames** | Zero physical name changes |
| **MCP** | No DB dependency |

---

## Client factory changes

Today both apps build Prisma clients from Hyperdrive:

| File | Current pattern |
| --- | --- |
| `apps/api/src/lib/db.ts` | `createHyperdriveClient` from `@marble/db/hyperdrive` (and unused/alternate `@marble/db/workers` import) via `env.HYPERDRIVE.connectionString` |
| `apps/jobs/src/lib/db.ts` | `createClient` from `@marble/db/hyperdrive` via `env.HYPERDRIVE.connectionString` |

### Target pattern

1. **Connection string** — Keep `getConnectionString(env)` (or equivalent) resolving `env.HYPERDRIVE.connectionString`; fail fast if missing.
2. **Driver** — Use **node-postgres (`pg`)** with Drizzle (`drizzle-orm/node-postgres`), not Prisma `PrismaPg` and not neon-serverless inside Workers Hyperdrive path.
3. **Factory** — Something like `createDbClient(env)` → `drizzle(pool, { schema })` where `pool` is constructed from the Hyperdrive connection string (shared helper may live in `@marble/drizzle` and be re-exported from each app’s `lib/db.ts`).
4. **Lifecycle** — Match Workers expectations: create per-request / per-invocation as today; do not assume a long-lived global Prisma singleton behavior beyond what Hyperdrive already provides.
5. **Types** — Replace `DbClient = ReturnType<typeof createDbClient>` with the Drizzle DB type from `@marble/drizzle`.
6. **Cleanup** — Remove `@marble/db/hyperdrive` / `@marble/db/workers` imports from api/jobs once call sites are migrated; leave package present until PR3.

### Migration order (suggested)

1. Add Hyperdrive Drizzle factory to `@marble/drizzle` (unused by CMS).
2. Point `apps/api/src/lib/db.ts` at the new factory; keep Prisma factory behind a temporary flag **only if** needed for staged rollout — prefer hard cut with parity tests first.
3. Migrate `apps/api` routes/modules domain by domain (keys, posts, media, webhooks, etc.).
4. Point `apps/jobs/src/lib/db.ts` at the same factory; migrate job handlers.
5. Grep for remaining `@marble/db` imports under `apps/api` and `apps/jobs` — must be zero at PR2 exit (config-only comments OK).

---

## Parity checks

Before merging PR2:

1. **Schema** — Re-run schema-check against Phase 0 baseline (plus any Prisma migrations applied during coexistence and re-baselined).
2. **API reads** — Public content endpoints return identical JSON for frozen IDs / known fixtures vs pre-cutover snapshots where practical.
3. **API writes** — Create/update/delete paths for posts, taxonomy, media metadata, webhooks, API keys match Prisma behavior (status codes + body shapes).
4. **API key auth** — Public API authentication against `apiKey` table works end-to-end (deferred from PR1 golden paths).
5. **Jobs** — Import / export / webhook delivery persistence: enqueue → worker write → DB row parity; no duplicate or missing side effects.
6. **Transactions** — Any `$transaction` sites in api/jobs ported to `db.transaction` on the Hyperdrive `pg` client with commit + rollback coverage.
7. **Regression** — CMS (PR1) still green; do not change CMS driver in this PR.

---

## Exit criteria (PR2 complete)

PR2 is done when all of the following hold:

1. **Prereq** — PR1 merged; `@marble/drizzle` Hyperdrive/`pg` factory available.
2. **Factories** — `apps/api/src/lib/db.ts` and `apps/jobs/src/lib/db.ts` create Drizzle clients via Hyperdrive + node-postgres (no Prisma Hyperdrive client at runtime).
3. **Zero Prisma runtime in workers** — No remaining runtime imports of `@marble/db`, `@marble/db/hyperdrive`, or `@marble/db/workers` in `apps/api` or `apps/jobs`.
4. **Parity** — API + jobs parity checks above are green on staging.
5. **CMS untouched** — No intentional CMS ORM regress; CMS remains on neon-serverless Drizzle from PR1.
6. **Prisma still present** — `@marble/db` remains in the monorepo for rollback until PR3; Prisma still owns migrations.
7. **No cache work** — Redis / Drizzle query cache not introduced in this PR.

---

## Safety rules (enforce in review)

1. Same database; no dumps/dual-writes/renames for cutover.
2. Do not start PR2 before PR1 merge.
3. One schema owner: Prisma until PR3.
4. Prefer closest Drizzle equivalent; do not “fix” queries mid-cutover.
5. Do not flush Redis or truncate session/user tables as part of worker testing.
6. Keep Hyperdrive as the connection path for api/jobs unless a documented, temporary local-dev bypass already exists and is reviewed.

---

## Risk notes specific to PR2

- **Driver mismatch:** Hyperdrive expects standard Postgres wire protocol — use `pg` / node-postgres with Drizzle, not the CMS neon-serverless WebSocket client.
- **Workers runtime:** Confirm `pg` (or the chosen Hyperdrive-compatible binding) works in the Cloudflare Workers / node-compat setup used by api/jobs today.
- **Blast radius:** Public API + async jobs; prefer domain-by-domain swaps with parity before removing Prisma call sites.
- **Shared schema:** Physical names (`workspace`, `ShareLink`, join tables) must match PR1 introspection — do not re-pull into a divergent schema.

---

## References

- Index: `docs/drizzle-migration/README.md`
- PR1: `docs/drizzle-migration/PR-1-cms.md`
- PR3: `docs/drizzle-migration/PR-3-remove-prisma.md`
- API factory: `apps/api/src/lib/db.ts`
- Jobs factory: `apps/jobs/src/lib/db.ts`
- Prisma Hyperdrive entry: `packages/db/src/hyperdrive.ts`
