---
title: "Prisma → Drizzle migration docs"
description: "Sequenced plans for moving Marble off Prisma onto Drizzle on the same Neon Postgres database."
---

## Prisma → Drizzle migration docs

Sequenced plans for moving Marble off Prisma onto Drizzle **on the same Neon Postgres database** (no data migration, no dual-writes, no physical renames during cutover).

### PR briefs

| PR | Doc | Scope | Status |
| --- | --- | --- | --- |
| **1** | [`PR-1-cms.md`](./PR-1-cms.md) | Drizzle foundation + **`apps/cms`** | Done (merged) |
| **2** | [`PR-2-api-jobs.md`](./PR-2-api-jobs.md) | **`apps/api` + `apps/jobs`**: Hyperdrive → Drizzle `pg` | Done |
| **3** | [`PR-3-remove-prisma.md`](./PR-3-remove-prisma.md) | Drizzle Kit owns schema; replace Prisma in `@marble/db` | Done |

### Current ownership

- **Schema / migrations:** Drizzle Kit in [`packages/db`](../../packages/db) (`pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`)
- **CMS runtime:** neon-serverless WebSocket via `@marble/db`
- **API / jobs runtime:** Hyperdrive + `pg.Client` via `@marble/db/hyperdrive`
- **Archived Prisma history:** [`archived-prisma/`](./archived-prisma/)

### Sequencing

<Steps>
<Step title="PR1">
Baseline + package + CMS cutover (neon-serverless **WebSocket**, not neon-http). Prove Better Auth + interactive transactions first.
</Step>
<Step title="PR2">
Only after PR1 is merged. Swap API/jobs client factories and call sites to Drizzle `pg` through Hyperdrive.
</Step>
<Step title="PR3">
Only after **zero** `@marble/db` runtime imports in cms, api, and jobs. Hand migrations to Drizzle Kit, archive Prisma history, delete Prisma.
</Step>
</Steps>

Do not skip ahead: workers before CMS auth soak, or Prisma removal before all three apps are off `@marble/db`, expands blast radius without reducing the highest auth risk.

### Safety rules (short)

- Same DB; no dumps, dual-writes, or table renames for cutover.
- One schema owner at a time: **Prisma until PR3**, then **Drizzle Kit only**.
- Never blind `drizzle-kit generate` / `migrate` against an already-Prisma-populated DB without a pull/journal baseline.
- Parity over cleverness — closest Drizzle equivalent first.
- Do not flush Redis or truncate `session` / `user` to make auth tests pass.
- Do not edit baseline JSON to hide drift.
- CMS auth: `@better-auth/drizzle-adapter`, provider `"pg"`, organization → `workspace`, keep Redis `secondaryStorage`, neon-serverless WS for interactive txs ([Neon + Drizzle](https://orm.drizzle.team/docs/connect-neon)).

Later polish (not scheduled in these briefs): Redis / Drizzle query cache, CMS neon-http experiments, query refactors.
