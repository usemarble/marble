---
title: "Prisma → Drizzle migration docs"
description: "Sequenced plans for moving Marble off Prisma onto Drizzle on the same Neon Postgres database."
---

## Prisma → Drizzle migration docs

Marble runs on **Drizzle** (`@marble/drizzle`) against the same Neon Postgres database. Prisma has been removed.

### PR briefs (historical)

| PR | Doc | Scope | Status |
| --- | --- | --- | --- |
| **1** | [`PR-1-cms.md`](./PR-1-cms.md) | Foundation (`@marble/drizzle`) + **`apps/cms`** | Done |
| **2** | [`PR-2-api-jobs.md`](./PR-2-api-jobs.md) | **`apps/api` + `apps/jobs`**: Hyperdrive → Drizzle `pg` | Done |
| **3** | [`PR-3-remove-prisma.md`](./PR-3-remove-prisma.md) | Drizzle Kit owns schema; remove `@marble/db` / Prisma | Done |

### Current ownership

- **Schema / migrations:** Drizzle Kit in [`packages/drizzle`](../../packages/drizzle) (`pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`)
- **CMS runtime:** neon-serverless WebSocket via `@marble/drizzle`
- **API / jobs runtime:** Hyperdrive + `pg.Client` via `@marble/drizzle/hyperdrive`
- **Archived Prisma history:** [`archived-prisma/`](./archived-prisma/)

Later polish (not in these briefs): Redis / Drizzle query cache, CMS neon-http experiments, query refactors.
