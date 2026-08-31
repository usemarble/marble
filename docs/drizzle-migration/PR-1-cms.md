---
title: "PR1 — CMS Prisma → Drizzle cutover"
description: "Foundation package and apps/cms-only Prisma to Drizzle cutover scope, phases, and exit criteria."
---

## PR1 — CMS Prisma → Drizzle cutover

Working title for the first migration PR: **foundation + `apps/cms` only**.

This document summarizes PR1 scope, phases, exit criteria, and out-of-scope items. It follows the safe Prisma → Drizzle migration plan and the hazard analysis that keeps API/jobs out of the first PR.

---

### Goal

Ship a correct ORM swap for the CMS that behaves like today on the **same Neon Postgres database**:

- No data migration, dual-writes, or physical table renames
- `@marble/drizzle` beside `@marble/db` (Prisma remains schema owner during coexistence)
- CMS driver stays **neon-serverless WebSocket** (same class of transport as Prisma today)
- Interactive transactions preserved for post/field writes
- Better Auth moved from `prismaAdapter` → `@better-auth/drizzle-adapter` (`drizzleAdapter`) with provider `"pg"` and correct `workspace` mapping
- Agent-runnable parity tests (schema / reads / writes+tx / auth soak)

**Not a goal of PR1:** removing Prisma, migrating workers, Redis query cache, neon-http (CMS stays on neon-serverless WebSocket), or schema redesign.

---

### Scope

#### In scope

| Area | Detail |
| --- | --- |
| Phase 0 | Import inventory, live schema baseline, parity checks |
| Phase 1 | Create `packages/drizzle` (`@marble/drizzle`); `drizzle-kit pull --init` against snapshotted DB; schema modules; CMS neon-serverless client export; schema-check green |
| Phase 2 | Add `@marble/drizzle` to CMS; migrate query domains incrementally with Prisma-vs-Drizzle tests before each route swap |
| Phase 3 | Swap Better Auth to `@better-auth/drizzle-adapter`; staging auth soak; golden paths |
| Docs | Inventory + this PR1 brief; baseline artifacts committed |

Approximate CMS surface from inventory: **~52 runtime files** importing `@marble/db` / `@marble/db/browser`, **4 `$transaction` sites**, Better Auth `prismaAdapter` in `apps/cms/src/lib/auth/server.ts`.

#### Out of scope (explicit)

| Item | Why deferred |
| --- | --- |
| **`apps/api`** | Different client stack (Hyperdrive + `PrismaPg`); expands review/blast radius; does not reduce CMS auth risk |
| **`apps/jobs`** | Same Hyperdrive path as API; import/webhook pipelines are a separate parity problem |
| **Removing `@marble/db` / Prisma** | Phase 5 — only after CMS + API + jobs are off Prisma |
| **Drizzle Kit as schema owner** | Phase 5 handoff; while both ORMs coexist, **only Prisma may migrate** |
| **Redis / Drizzle query cache** | Post-v1 polish |
| **Switching CMS to neon-http** | Breaks interactive transactions — use neon-serverless **WebSocket** (`drizzle-orm/neon-serverless`), not neon-http; see [Connect to Neon](https://orm.drizzle.team/docs/connect-neon). Post-migration experiment only |
| **Schema redesign / renaming tables** | Zero physical name changes during cutover (`Organization` stays mapped to `workspace`, `ShareLink` stays PascalCase, etc.) |
| **Rewriting txs to HTTP `batch()`** | Keep interactive callbacks |
| **Flushing Redis or truncating `session` / `user`** | Forbidden for green auth tests |
| **MCP** | No DB dependency |

---

### Recommended PR sequence (context)

| PR | Scope |
| --- | --- |
| **1 (this PR)** | Phase 0–3: baseline + `@marble/drizzle` + **CMS only** (queries → Better Auth) |
| **2** | `apps/api` + `apps/jobs` Hyperdrive → Drizzle (`docs/drizzle-migration/PR-2-api-jobs.md`) |
| **3** | Remove `@marble/db` / Prisma; Drizzle owns migrations (`docs/drizzle-migration/PR-3-remove-prisma.md`) |
| **4+** | Cache / neon-http / query polish |

Prisma stays installed through PR1–2 for rollback and for apps not yet migrated.

---

### Phases (PR1)

#### Phase 0 — Inventory, original-DB snapshot, parity harness

**Do before** creating `packages/drizzle` behavior and **before** any `drizzle-kit` command.

<Steps>
<Step title="Record inventory">
- every `@marble/db` / `@marble/db/browser` import
- every `$transaction` (and confirm no raw SQL in CMS)
- Better Auth models + `@@map` names
- golden paths
</Step>
<Step title="Snapshot the staging/branch DB">
Snapshot `prisma-schema.prisma`, `information_schema` dumps, `pg_dump --schema-only`, and row counts.
</Step>
<Step title="Freeze real IDs">
Freeze real IDs for parity checks if needed.
</Step>
<Step title="Lay out parity harness">
Lay out parity harness (later copied to `packages/drizzle/src/__parity__/`).
</Step>
</Steps>

**Phase 0 exit:** baseline files committed; inventory complete; harness layout defined. No Drizzle package required yet for the inventory/baseline commits, but no `drizzle-kit` until baseline exists.

#### Phase 1 — Stand up `@marble/drizzle` (no CMS behavior change)

**Gate:** Phase 0 baseline in git.

- Deps: `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `ws`, `pg` (Hyperdrive export can stay unused until PR2)
- `drizzle.config.ts` → same `DATABASE_URL` / `DIRECT_URL` pattern as `packages/db`
- `pnpm drizzle-kit pull --init` on the **same** DB that was snapshotted
- Organize schema under `packages/drizzle/src/schema/`
- Fix Better Auth naming: physical `workspace` must map to organization expectations (same as Prisma `Organization` + `@@map("workspace")`)
- Export CMS client: `drizzle-orm/neon-serverless` (`Pool` + `ws`), mirroring `packages/db/src/index.ts` — **not** `drizzle-orm/neon-http` ([Neon + Drizzle](https://orm.drizzle.team/docs/connect-neon); HTTP cannot run interactive transactions)
- Run `schema-check.test.ts` vs Phase 0 baseline (only allowed extra: Drizzle journal table)

**Phase 1 exit:** schema-check green; **no CMS routes switched**.

#### Phase 2 — CMS query migration (Prisma + Drizzle coexist)

Add `@marble/drizzle` to CMS. Migrate **one domain at a time**, auth last:

<Steps>
<Step title="Read-only dashboard queries">
Migrate `apps/cms/src/lib/queries/`.
</Step>
<Step title="Taxonomy">
Migrate tags / categories / authors.
</Step>
<Step title="Media / share links">
Migrate media and share link domains.
</Step>
<Step title="Posts + custom fields">
Port `$transaction` → `db.transaction` on WS client (all 4 sites).
</Step>
<Step title="Workspaces / members / invitations">
Migrate auth-adjacent app queries.
</Step>
<Step title="Billing / Polar / usage">
Migrate billing, Polar, and usage domains.
</Step>
<Step title="Import / export jobs">
Migrate import and export job domains.
</Step>
<Step title="Better Auth → Phase 3">
Hand off to the Better Auth adapter swap.
</Step>
</Steps>

Per slice:

<Steps>
<Step title="Add parity tests">
Add `__parity__/reads/<domain>.test.ts` (and writes/tx if mutating).
</Step>
<Step title="Implement Drizzle until parity">
Implement Drizzle until tests match Prisma on frozen IDs.
</Step>
<Step title="Swap the route/query module">
Swap the route/query module; keep HTTP/JSON shapes identical.
</Step>
<Step title="Keep rollback available">
Rollback = revert the change (Prisma package still present).
</Step>
</Steps>

**Phase 2 exit:** CMS application queries on Drizzle except Better Auth adapter; parity tests green per domain; interactive txs proven (commit + mid-callback rollback).

#### Phase 3 — Better Auth adapter swap

In `apps/cms/src/lib/auth/server.ts`:

- Replace `better-auth/adapters/prisma` (`prismaAdapter`) with **`@better-auth/drizzle-adapter`** (`drizzleAdapter`)
- Configure the adapter with provider **`"pg"`** (Postgres)
- Map Better Auth **organization → physical `workspace` table** (same as today’s `organization: { modelName: "workspace" }` / Prisma `Organization` + `@@map("workspace")`)
- Pass an explicit schema with physical names: `user`, `session`, `account`, `verification`, `workspace` (organization), `member`, `invitation`
- Keep Redis **`secondaryStorage` unchanged** (do not flush Redis; sessions must survive the swap)
- Use the same CMS Drizzle client: **neon-serverless WebSocket** (`drizzle-orm/neon-serverless`), **not** neon-http
- When swapping, move `experimental: { joins: true }` → **`advanced.database.joins: true`** (merge with the existing `advanced.database.generateId: false` block)

**Phase 3 exit:** `auth-soak.test.ts` + golden paths; **existing sessions survive**; no Redis flush.

---

### Exit criteria (PR1 complete)

PR1 is done when all of the following hold:

1. **Baseline** — Phase 0 baseline exists; schema-check matches it (plus documented Drizzle journal table / any Prisma migrates applied during coexistence and re-baselined).
2. **Package** — `@marble/drizzle` published in-workspace with CMS neon-serverless client and schema modules.
3. **CMS queries** — No remaining runtime `@marble/db` query usage in CMS app routes/libs **except** what is required only until the auth swap lands in the same PR; end state is CMS on Drizzle for queries + auth.
4. **Transactions** — All four CMS `$transaction` sites have Drizzle equivalents with happy-path + rollback parity tests.
5. **Auth** — Better Auth on `@better-auth/drizzle-adapter` (provider `"pg"`, organization→`workspace`); soak user session still works after swap; login / OTP / org create / invite / org switch covered; `experimental.joins` migrated to `advanced.database.joins`.
6. **Golden paths** (CMS-relevant) pass on staging:
   - login / session restore
   - create workspace
   - CRUD post with custom fields
   - media upload
   - Polar webhook
   - invite member / switch org
   - CMS API key CRUD remains correct (public API key *auth* against `apps/api` deferred to PR2)
7. **Workers untouched** — `apps/api` and `apps/jobs` still import `@marble/db`; no Hyperdrive Drizzle cutover in this PR.
8. **Prisma still present** — `@marble/db` remains for rollback and for API/jobs; Prisma still owns migrations.

---

### Safety rules (enforce in review)

1. Database does not move; no dumps/dual-writes/renames for cutover.
2. Do not rename `packages/db` mid-flight.
3. One schema owner: Prisma until Phase 5 / PR3.
4. Never blind `drizzle-kit generate` / `migrate` against a DB that already has Prisma tables without `pull --init` baseline.
5. No `drizzle-kit` before Phase 0 baseline commit.
6. Parity over cleverness — closest Drizzle equivalent first.
7. Do not flush Redis or truncate session/user tables to make tests pass.
8. Do not edit baseline JSON to hide drift.

---

### Risk notes specific to PR1

- **Highest risk:** Better Auth adapter + `Organization` → `workspace` mapping + Redis secondary storage session survival.
- **Highest complexity queries:** posts + custom fields (nested M2M `_PostToTag` / `_PostToAuthor`, fieldValue upserts, Serializable field update tx).
- **Odd physical name:** `ShareLink` has no `@@map` (PascalCase table) — introspected schema must preserve it.
- **Do not expand PR1** to API/jobs: doubles/triples driver and review surface before CMS auth is proven.

---

### References

- Index: `docs/drizzle-migration/README.md`
- PR2: `docs/drizzle-migration/PR-2-api-jobs.md`
- PR3: `docs/drizzle-migration/PR-3-remove-prisma.md`
- Migration plan: Prisma → Drizzle (Phase 0–5)
- Schema: `packages/db/prisma/schema.prisma`
- CMS auth: `apps/cms/src/lib/auth/server.ts`
- CMS Prisma client: `@marble/db` → `packages/db/src/index.ts` (neon-serverless)
- Better Auth Drizzle adapter: `@better-auth/drizzle-adapter` (provider `"pg"`)
- Neon + Drizzle (use WebSocket / `neon-serverless`, not neon-http, for interactive transactions): [Connect to Neon](https://orm.drizzle.team/docs/connect-neon)
