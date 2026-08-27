# PR3 — Remove Prisma; Drizzle Kit owns schema

Working title for the third migration PR: **schema ownership handoff + delete `@marble/db` / Prisma**.

This document covers gates, steps, archiving Prisma migrations, and exit criteria. It assumes PR1 (CMS) and PR2 (API + jobs) are merged and stable.

Index: [`README.md`](./README.md).

---

## Goal

Make **Drizzle Kit** the sole schema and migration owner, and remove the Prisma stack (`@marble/db`, Prisma Client, Prisma CLI) from the monorepo — without changing physical tables or requiring a data migration.

**Not a goal of PR3:** Redis query cache, neon-http CMS experiments, or schema redesign / table renames.

---

## Gates (do not start without these)

PR3 is blocked until **all** of the following are true:

1. **Zero `@marble/db` runtime imports in `apps/cms`** — no `db` / Prisma types from `@marble/db` or `@marble/db/browser` in application code (transpilePackages / docs mentions cleaned up or removed as appropriate).
2. **Zero `@marble/db` runtime imports in `apps/api`** — including `@marble/db/hyperdrive` and `@marble/db/workers`.
3. **Zero `@marble/db` runtime imports in `apps/jobs`** — including Hyperdrive entrypoints.
4. Staging soak for CMS auth + public API + critical jobs is green on Drizzle.
5. Schema-check still matches the committed baseline (plus intentional Drizzle journal / migration history tables).

Verify with a repo-wide grep (and CI check if useful):

```bash
rg "@marble/db" apps/cms apps/api apps/jobs --glob '!**/node_modules/**'
```

Any remaining hits must be non-runtime (comments, historical docs) or fixed before proceeding.

---

## Steps

### 1. Freeze Prisma as non-owner

- Confirm no open PRs still adding Prisma migrations or `@marble/db` imports.
- Document that **new** DDL goes through Drizzle Kit only from this PR forward.

### 2. Baseline Drizzle migrations from the live schema

- Ensure `packages/drizzle` schema modules match production / staging (from PR1 `pull --init` + any coexistence Prisma migrates that were re-baselined).
- Initialize or finalize Drizzle Kit migration journal so the next `drizzle-kit generate` / `migrate` is incremental, not a blind recreate of existing tables.
- Prefer `drizzle-kit pull` / journal alignment over generating a full “create everything” migration against a DB that already has Prisma-built tables.

### 3. Archive Prisma migrations

- Move `packages/db/prisma/migrations/` (and related Prisma migration history artifacts) to an **archive** location, e.g. `packages/db/_archived_prisma/migrations/`.
- Keep the archive **read-only historical record** — do not run `prisma migrate` against shared environments after cutover.
- Preserve enough context (README in the archive folder) to explain that production tables were created under Prisma and ownership moved to Drizzle Kit as of PR3.

### 4. Point tooling at Drizzle Kit

- CI / scripts that invoked Prisma migrate or `packages/db` generate switch to `drizzle-kit` from `@marble/drizzle`.
- Env docs: `DATABASE_URL` / `DIRECT_URL` (or project equivalents) documented for Drizzle Kit only.
- Remove Prisma from root/workspace tooling (`prisma` CLI scripts, `prisma.config.ts` consumers, etc.).

### 5. Remove `@marble/db` / Prisma packages

- Delete or gut `packages/db` after dependents are gone (prefer delete once nothing imports it).
- Remove workspace dependencies on `@marble/db`, `@prisma/client`, Prisma adapters, and related Workers/Hyperdrive Prisma shims.
- Drop `transpilePackages: ["@marble/db"]` (and similar) from CMS/Next config.
- Update lockfile / `pnpm` workspace list.

### 6. Docs and inventory

- Mark PR1–PR2 complete in [`README.md`](./README.md).
- Note in inventory / migration docs that Prisma is archived and Drizzle Kit is the schema owner.
- Link to the archived Prisma migrations path.

---

## Exit criteria (PR3 complete)

1. **Gates satisfied** — zero `@marble/db` runtime imports in cms / api / jobs before package removal; still zero after.
2. **Drizzle Kit owns DDL** — new migrations are generated and applied via Drizzle Kit; Prisma migrate is not used.
3. **Prisma migrations archived** — historical Prisma migration folders preserved under a documented archive path, not active tooling.
4. **`@marble/db` removed** — package and Prisma runtime deps gone from the workspace; apps depend only on `@marble/drizzle` (and drivers).
5. **Apps healthy** — CMS, API, and jobs smoke / golden paths still pass on staging after removal (no latent Prisma imports).
6. **No cache / redesign** — Redis query cache and neon-http / schema renames remain out of scope.

---

## Out of scope

| Item | Notes |
| --- | --- |
| Redis / Drizzle query cache | Later polish PRs |
| CMS neon-http | Still deferred; interactive txs need neon-serverless WS |
| Physical renames (`workspace`, `ShareLink`, etc.) | Separate deliberate migration if ever needed |
| Rewriting business logic | Cutover only |

---

## Safety rules

1. Do not delete Prisma while any app still imports `@marble/db` at runtime.
2. Do not `drizzle-kit drop` / recreate production tables to “clean” history.
3. Do not flush Redis or truncate auth tables to prove the handoff.
4. Archive Prisma migrations before removing the package so history is not lost.
5. Prefer a short-lived “Prisma package empty / deprecated” commit only if needed for bisect; default is remove once gates are green.

---

## Risk notes

- **Latent type-only imports** from `@marble/db/browser` can block deletion — replace with Drizzle-inferred types or shared enums in `@marble/drizzle` before removal.
- **CI scripts** that still call `prisma generate` / `migrate` will fail the handoff if not updated in the same PR.
- **Journal mismatch** — applying a full initial Drizzle migration to an already-populated DB is the highest DDL risk; align journal first.

---

## References

- Index: `docs/drizzle-migration/README.md`
- PR1: `docs/drizzle-migration/PR-1-cms.md`
- PR2: `docs/drizzle-migration/PR-2-api-jobs.md`
- Prisma schema (pre-removal): `packages/db/prisma/schema.prisma`
