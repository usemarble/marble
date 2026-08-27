# Prisma → Drizzle migration docs

Sequenced plans for moving Marble off Prisma onto Drizzle **on the same Neon Postgres database** (no data migration, no dual-writes, no physical renames during cutover).

## PR briefs

| PR | Doc | Scope |
| --- | --- | --- |
| **1** | [`PR-1-cms.md`](./PR-1-cms.md) | Foundation (`@marble/drizzle`) + **`apps/cms` only** (queries → Better Auth via `@better-auth/drizzle-adapter`) |
| **2** | [`PR-2-api-jobs.md`](./PR-2-api-jobs.md) | **`apps/api` + `apps/jobs`**: Prisma Hyperdrive → Drizzle **node-postgres** via Hyperdrive |
| **3** | [`PR-3-remove-prisma.md`](./PR-3-remove-prisma.md) | Drizzle Kit owns schema; archive Prisma migrations; remove `@marble/db` / Prisma |

Later polish (not scheduled in these briefs): Redis / Drizzle query cache, CMS neon-http experiments, query refactors.

## Sequencing

1. **PR1** — Baseline + package + CMS cutover (neon-serverless **WebSocket**, not neon-http). Prove Better Auth + interactive transactions first.
2. **PR2** — Only after PR1 is merged. Swap API/jobs client factories and call sites to Drizzle `pg` through Hyperdrive. Prisma remains installed for rollback.
3. **PR3** — Only after **zero** `@marble/db` runtime imports in cms, api, and jobs. Hand migrations to Drizzle Kit, archive Prisma history, delete Prisma.

Do not skip ahead: workers before CMS auth soak, or Prisma removal before all three apps are off `@marble/db`, expands blast radius without reducing the highest auth risk.

## Safety rules (short)

- Same DB; no dumps, dual-writes, or table renames for cutover.
- One schema owner at a time: **Prisma until PR3**, then **Drizzle Kit only**.
- Never blind `drizzle-kit generate` / `migrate` against an already-Prisma-populated DB without a pull/journal baseline.
- Parity over cleverness — closest Drizzle equivalent first.
- Do not flush Redis or truncate `session` / `user` to make auth tests pass.
- Do not edit baseline JSON to hide drift.
- CMS auth: `@better-auth/drizzle-adapter`, provider `"pg"`, organization → `workspace`, keep Redis `secondaryStorage`, neon-serverless WS for interactive txs ([Neon + Drizzle](https://orm.drizzle.team/docs/connect-neon)).
