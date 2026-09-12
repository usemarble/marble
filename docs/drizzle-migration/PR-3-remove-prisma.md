---
title: "PR3 — Remove Prisma; Drizzle Kit owns schema"
description: "Hand schema ownership to Drizzle Kit, archive Prisma migrations, and replace the Prisma-backed database package."
---

## PR3 — Remove Prisma; Drizzle Kit owns schema

Working title for the third migration PR: **schema ownership handoff + replace the Prisma-backed `@marble/db` implementation**.

This document covers gates, steps, archiving Prisma migrations, and exit criteria. It assumes PR1 (CMS) and PR2 (API + jobs) are merged and stable.

Index: [`README.md`](./README.md).

---

### Goal

Make **Drizzle Kit** the sole schema and migration owner, remove Prisma Client and Prisma CLI, and retain `packages/db` / `@marble/db` as the Drizzle-backed database package — without changing physical tables or requiring a data migration.

**Not a goal of PR3:** Redis query cache, neon-http CMS experiments, or schema redesign / table renames.

---

### Gates (do not start without these)

PR3 is blocked until **all** of the following are true:

1. **Zero Prisma runtime imports in `apps/cms`** — no Prisma client or generated Prisma types such as `@marble/db/browser` in application code.
2. **Zero Prisma runtime imports in `apps/api`** — database imports resolve to the Drizzle-backed `@marble/db` exports.
3. **Zero Prisma runtime imports in `apps/jobs`** — Hyperdrive uses the Drizzle `@marble/db/hyperdrive` entrypoint.
4. Staging soak for CMS auth + public API + critical jobs is green on Drizzle.
5. Schema-check still matches the committed baseline (plus intentional Drizzle journal / migration history tables).

Verify with a repo-wide grep (and CI check if useful):

```bash
rg "@prisma/client|@better-auth/prisma-adapter|@marble/db/(browser|workers)" apps/cms apps/api apps/jobs --glob '!**/node_modules/**'
```

Any remaining hits must be non-runtime (comments, historical docs) or fixed before proceeding.

---

### Steps

<Steps>
<Step title="Freeze Prisma as non-owner">
- Confirm no open PRs still adding Prisma migrations or Prisma client imports.
- Document that **new** DDL goes through Drizzle Kit only from this PR forward.
</Step>
<Step title="Baseline Drizzle migrations from the live schema">
- Ensure `packages/db` schema modules match production / staging (from PR1 `pull --init` + any coexistence Prisma migrations that were re-baselined).
- Initialize or finalize Drizzle Kit migration journal so the next `drizzle-kit generate` / `migrate` is incremental, not a blind recreate of existing tables.
- Prefer `drizzle-kit pull` / journal alignment over generating a full “create everything” migration against a DB that already has Prisma-built tables.
</Step>
<Step title="Archive Prisma migrations">
- Move `packages/db/prisma/migrations/` (and related Prisma migration history artifacts) to a durable archive outside `packages/db`, e.g. `docs/drizzle-migration/archived-prisma/migrations/`.
- Keep the archive **read-only historical record** — do not run `prisma migrate` against shared environments after cutover.
- Preserve enough context (README in the archive folder) to explain that production tables were created under Prisma and ownership moved to Drizzle Kit as of PR3.
- Do **not** delete this archive when replacing the Prisma-backed package contents in later steps.
</Step>
<Step title="Point tooling at Drizzle Kit">
- CI / scripts that invoked Prisma migrate or Prisma generate switch to `drizzle-kit` from `@marble/db`.
- Env docs: `DATABASE_URL` / `DIRECT_URL` (or project equivalents) documented for Drizzle Kit only.
- Remove Prisma from root/workspace tooling (`prisma` CLI scripts, `prisma.config.ts` consumers, etc.).
</Step>
<Step title="Replace the Prisma-backed package">
- Remove the Prisma implementation from `packages/db` after all dependents use Drizzle.
- Move the temporary Drizzle package into `packages/db` and name it `@marble/db`.
- Leave `docs/drizzle-migration/archived-prisma/` intact — replacing the package must not remove the archived Prisma migration history.
- Remove workspace dependencies on `@prisma/client`, Prisma adapters, and related Workers/Hyperdrive Prisma shims.
- Keep `transpilePackages: ["@marble/db"]` in CMS/Next config for the Drizzle-backed package.
- Update the lockfile and workspace links.
</Step>
<Step title="Docs and inventory">
- Mark PR1–PR2 complete in [`README.md`](./README.md).
- Note in inventory / migration docs that Prisma is archived and Drizzle Kit is the schema owner.
- Link to the archived Prisma migrations path (`docs/drizzle-migration/archived-prisma/`).
</Step>
</Steps>

---

### Exit criteria (PR3 complete)

1. **Gates satisfied** — zero Prisma runtime imports in CMS, API, and jobs.
2. **Drizzle Kit owns DDL** — new migrations are generated and applied via Drizzle Kit; Prisma migrate is not used.
3. **Prisma migrations archived** — historical Prisma migration folders preserved under a documented archive path, not active tooling.
4. **`@marble/db` is Drizzle-backed** — Prisma runtime dependencies are gone; CMS, API, and jobs use the retained package name.
5. **Apps healthy** — CMS, API, and jobs smoke / golden paths still pass on staging after removal (no latent Prisma imports).
6. **No cache / redesign** — Redis query cache and neon-http / schema renames remain out of scope.

---

### Out of scope

| Item | Notes |
| --- | --- |
| Redis / Drizzle query cache | Later polish PRs |
| CMS neon-http | Still deferred; interactive txs need neon-serverless WS |
| Physical renames (`workspace`, `ShareLink`, etc.) | Separate deliberate migration if ever needed |
| Rewriting business logic | Cutover only |

---

### Safety rules

1. Do not remove the Prisma implementation while any app still imports its generated client or Prisma-only entrypoints.
2. Do not `drizzle-kit drop` / recreate production tables to “clean” history.
3. Do not flush Redis or truncate auth tables to prove the handoff.
4. Archive Prisma migrations before replacing the package contents so history is not lost.
5. Prefer a short-lived “Prisma implementation empty / deprecated” commit only if needed for bisect; default is replace it once gates are green.

---

### Risk notes

- **Latent type-only imports** from the former `@marble/db/browser` Prisma entrypoint can block removal — replace them with Drizzle-inferred types or shared enums in `@marble/db`.
- **CI scripts** that still call `prisma generate` / `migrate` will fail the handoff if not updated in the same PR.
- **Journal mismatch** — applying a full initial Drizzle migration to an already-populated DB is the highest DDL risk; align journal first.

---

### References

- Index: `docs/drizzle-migration/README.md`
- PR1: `docs/drizzle-migration/PR-1-cms.md`
- PR2: `docs/drizzle-migration/PR-2-api-jobs.md`
- Archived Prisma schema: `docs/drizzle-migration/archived-prisma/schema.prisma`
