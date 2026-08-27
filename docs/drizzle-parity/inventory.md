# Prisma → Drizzle inventory (`apps/cms`)

Phase 0 inventory for the CMS cutover. Scope is **`apps/cms` only**.  
**`apps/api` and `apps/jobs` are OUT OF SCOPE for PR1** — they remain on `@marble/db` / Prisma until a later PR.

Source of truth for this file: live codebase scan of `apps/cms` + `packages/db/prisma/schema.prisma`, aligned with the migration plan golden paths.

---

## Scope and exclusions

| In scope (PR1) | Out of scope (PR1) |
| --- | --- |
| Every `@marble/db` / `@marble/db/browser` import under `apps/cms` | `apps/api` |
| CMS `$transaction` sites | `apps/jobs` |
| Better Auth Prisma adapter + org tables used by CMS | `@marble/db/hyperdrive` consumers |
| Golden-path smoke list from the migration plan | Removing Prisma / schema ownership handoff (Phase 5) |
| | Redis query cache, neon-http, schema redesign |

**Raw SQL:** no `$queryRaw`, `$executeRaw`, or `Prisma.sql` usages in `apps/cms`.

**Hyperdrive:** CMS does not import `@marble/db/hyperdrive`. CMS uses the neon-serverless WebSocket client from `@marble/db` (`packages/db/src/index.ts`).

**Config-only reference:** `apps/cms/next.config.ts` lists `"@marble/db"` in `transpilePackages` (not a runtime query import).

---

## Summary counts

| Metric | Count |
| --- | --- |
| Files importing `@marble/db` or `@marble/db/browser` (runtime) | **52** |
| Plus `next.config.ts` transpile reference | **53** total mentions |
| Files importing `@marble/db/browser` | **7** |
| `$transaction` sites | **4** |
| `$queryRaw` / `$executeRaw` / `Prisma.sql` | **0** |
| Distinct Prisma client models touched via `db.*` / `tx.*` | **22** (see model rollup) |

---

## 1. File-by-file import inventory

Legend:

- **Import** — package entry used
- **Models / ops** — `db.<model>.<method>` (and `tx.*` inside transactions)
- **Types / enums** — named exports from `@marble/db/browser` or Prisma namespace

### API routes

#### Media / upload

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/media/editor/route.ts` | `{ db }` from `@marble/db` | `media.count`, `media.findMany` (+ `select`) | — |
| `apps/cms/src/app/api/media/route.ts` | `{ db }` from `@marble/db` | `media.findMany`, `media.deleteMany` | — |
| `apps/cms/src/app/api/media/[id]/route.ts` | `{ db }` from `@marble/db` | `media.findFirst`, `media.update` (+ `select`) | — |
| `apps/cms/src/app/api/upload/complete/route.ts` | `{ db }` from `@marble/db` | `organization.update`, `media.create` | — |

#### API keys

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/keys/route.ts` | `{ db }` from `@marble/db` | `apiKey.create` (+ `select`) | — |
| `apps/cms/src/app/api/keys/[id]/route.ts` | `{ db }` from `@marble/db` | `apiKey.findFirst`, `apiKey.update`, `apiKey.delete` (+ `select`) | — |

#### Custom fields

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/fields/route.ts` | `{ db }` from `@marble/db`; `type { FieldType as PrismaFieldType }` from `@marble/db/browser` | `field.findFirst`, `field.aggregate`, `field.create` (+ nested `options` / `include`) | `FieldType` (as `PrismaFieldType`) |
| `apps/cms/src/app/api/fields/[id]/route.ts` | `{ db }` from `@marble/db`; `{ Prisma }` from `@marble/db/browser` | `field.findFirst`, `field.update` (via `$transaction`), `field.delete`; inside tx: `fieldValue.count`, nested `options` rewrite | `Prisma.TransactionIsolationLevel.Serializable` |

#### Webhooks

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/webhooks/route.ts` | `{ db }` from `@marble/db` | `webhookEndpoint.create` | — |
| `apps/cms/src/app/api/webhooks/[id]/route.ts` | `{ db }` from `@marble/db` | `webhookEndpoint.findFirst`, `webhookEndpoint.update`, `webhookEndpoint.delete`; `webhookDelivery.findMany`, `webhookDelivery.count` (+ `include` for deliveries) | — |

#### Share links

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/share/route.ts` | `{ db }` from `@marble/db` | `subscription.findFirst`, `post.findFirst`, `shareLink.findFirst`, `shareLink.create` | — |
| `apps/cms/src/app/api/share/[token]/route.ts` | `{ db }` from `@marble/db` | `shareLink.findFirst` (+ deep `include`/`select` for post, category, tags, authors, primaryAuthor) | — |

#### Authors

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/authors/route.ts` | `{ db }` from `@marble/db` | `organization.findUnique`, `author.count`, `author.findUnique`, `author.create` (nested `socials.create` → `AuthorSocial`) | — |
| `apps/cms/src/app/api/authors/[id]/route.ts` | `{ db }` from `@marble/db` | `author.findFirst`, `author.delete`, `author.update` (+ `include: { socials }`) | — |

#### Posts + post fields

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/posts/route.ts` | `{ db }` from `@marble/db` | Pre-tx: `field.findMany`, `post.findFirst`, `author.findUnique` / `findFirst` / `create`, `category.findFirst`, `author.findMany`. Tx: `post.create` (connect tags/authors), `fieldValue.deleteMany` / `upsert` | — |
| `apps/cms/src/app/api/posts/[id]/route.ts` | `{ db }` from `@marble/db` | Pre-tx: `field.findMany`, `post.findFirst`, `category.findFirst`, `author.findMany`. Tx: `post.update` (set tags/authors), `fieldValue.deleteMany` / `upsert`. Also `post.delete` | — |
| `apps/cms/src/app/api/posts/[id]/fields/route.ts` | `{ db }` from `@marble/db` | `post.findFirst`, `field.findMany`, `fieldValue.findMany`; batch `$transaction` of `fieldValue.deleteMany` / `upsert` | — |

#### Taxonomy

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/tags/route.ts` | `{ db }` from `@marble/db` | `tag.findFirst`, `tag.create` | — |
| `apps/cms/src/app/api/tags/[id]/route.ts` | `{ db }` from `@marble/db` | `tag.findFirst`, `tag.update`, `tag.delete` | — |
| `apps/cms/src/app/api/categories/route.ts` | `{ db }` from `@marble/db` | `category.findFirst`, `category.create` | — |
| `apps/cms/src/app/api/categories/[id]/route.ts` | `{ db }` from `@marble/db` | `category.findFirst`, `category.update`, `category.delete`; `post.findFirst` (block delete if posts reference category) | — |

#### Workspaces / user / accounts

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/workspaces/route.ts` | `{ db }` from `@marble/db` | `organization.findMany` (+ nested `members`/`user`, `invitations`, `subscriptions` `select`) | — |
| `apps/cms/src/app/api/workspaces/[slug]/route.ts` | `{ db }` from `@marble/db` | `organization.findFirst` (same nested shape) | — |
| `apps/cms/src/app/api/user/route.ts` | `{ db }` from `@marble/db` | `user.findUnique`, `user.update` (+ nested notification prefs `select`) | — |
| `apps/cms/src/app/api/user/notifications/route.ts` | `{ db }` from `@marble/db` | `userNotificationPreferences.findUnique` / `upsert`; `member.findFirst`; `workspaceNotificationPreferences.upsert` | — |
| `apps/cms/src/app/api/accounts/route.ts` | `{ db }` from `@marble/db` | `account.findMany` (+ `select`) | — |
| `apps/cms/src/app/api/accounts/[id]/route.ts` | `{ db }` from `@marble/db` | `account.delete` | — |

#### Billing / Polar / metrics / AI

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/polar/success/route.ts` | `{ db }` from `@marble/db` | `organization.findUnique` | — |
| `apps/cms/src/app/api/metrics/publishing/route.ts` | `{ db }` from `@marble/db` | `post.findMany` (+ `select`) | — |
| `apps/cms/src/app/api/ai/suggestions/route.tsx` | `{ db }` from `@marble/db` | `post.findFirst` (+ `select`) | — |

#### Import / export

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/app/api/data/export/route.ts` | `{ db }` from `@marble/db` | `exportJob.findMany`, `exportJob.create`, `exportJob.update` | — |
| `apps/cms/src/app/api/data/export/[id]/download/route.ts` | `{ db }` from `@marble/db` | `exportJob.findUnique` (+ `include` workspace) | — |
| `apps/cms/src/app/api/data/import/route.ts` | `{ db }` from `@marble/db` | `importJob.findMany`, `importJob.create`, `importJob.update` | — |

### Lib: auth

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/lib/auth/server.ts` | `{ db }` from `@marble/db` | `member.findFirst` (checkout owner guard). Also passes `db` to `prismaAdapter(db, { provider: "postgresql" })` — Better Auth owns CRUD on `user` / `session` / `account` / `verification` / `organization`→`workspace` / `member` / `invitation` | — |
| `apps/cms/src/lib/auth/hooks.ts` | `{ db }` from `@marble/db` | `author.findUnique`, `author.create`; `user.update` (image after signup) | — |
| `apps/cms/src/lib/auth/access.ts` | `{ db }` from `@marble/db` | `member.findFirst` (workspace membership / role gates; nested `organization` where needed) | — |

### Lib: queries

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/lib/queries/dashboard/posts.ts` | `{ db }` from `@marble/db` | `post.findMany`, `post.count` | — |
| `apps/cms/src/lib/queries/dashboard/authors.ts` | `{ db }` from `@marble/db` | `author.findMany` | — |
| `apps/cms/src/lib/queries/dashboard/taxonomy.ts` | `{ db }` from `@marble/db` | `category.findMany`, `tag.findMany` | — |
| `apps/cms/src/lib/queries/dashboard/media.ts` | `{ db }` from `@marble/db` | `media.findMany`, `media.count` | — |
| `apps/cms/src/lib/queries/dashboard/settings.ts` | `{ db }` from `@marble/db` | `apiKey.findMany`, `webhookEndpoint.findMany`, `field.findMany` | — |
| `apps/cms/src/lib/queries/dashboard/usage.ts` | `{ db }` from `@marble/db`; `{ UsageEventType }` from `@marble/db/browser` | `usageEvent.findMany` / `count` / `groupBy` / `findFirst`; `media.findMany` | `UsageEventType.api_request`, `.media_upload`, `.webhook_delivery` |
| `apps/cms/src/lib/queries/workspace.ts` | `{ db }` from `@marble/db`; `{ SubscriptionStatus }` from `@marble/db/browser` | `organization.findFirst` / `findUnique` (active workspace resolution + subscription nested filters) | `SubscriptionStatus.active`, `.trialing`, `.canceled` |
| `apps/cms/src/lib/queries/user.ts` | `{ db }` from `@marble/db` | `user.findUnique`, `member.findFirst` | — |

### Lib: Polar / subscription / validations / usage

| File | Import | Models / ops | Types / enums |
| --- | --- | --- | --- |
| `apps/cms/src/lib/polar/utils.ts` | `{ PlanType, type SubscriptionRecurringInterval, SubscriptionStatus }` from `@marble/db/browser` | — (no `db`) | `PlanType.pro` / `.hobby`; `SubscriptionStatus.active` / `.trialing` / `.canceled` / `.past_due` / `.expired`; type `SubscriptionRecurringInterval` |
| `apps/cms/src/lib/polar/subscription.created.ts` | `{ db }` from `@marble/db` | `user.findUnique`, `organization.findUnique`, `subscription.findUnique`, `subscription.create` | (status via `getSubscriptionStatus`) |
| `apps/cms/src/lib/polar/subscription.updated.ts` | `{ db }` from `@marble/db` | `subscription.findUnique`, `subscription.updateMany` | (status via `getSubscriptionStatus`) |
| `apps/cms/src/lib/polar/subscription.canceled.ts` | `{ db }` from `@marble/db`; `{ SubscriptionStatus }` from `@marble/db/browser` | `subscription.findUnique`, `subscription.updateMany` | `SubscriptionStatus.canceled` |
| `apps/cms/src/lib/polar/subscription.revoked.ts` | `{ db }` from `@marble/db`; `{ SubscriptionStatus }` from `@marble/db/browser` | `subscription.findUnique`, `subscription.updateMany` | `SubscriptionStatus.expired` |
| `apps/cms/src/lib/subscription/access.ts` | `{ db }` from `@marble/db` | `subscription.findFirst` | — |
| `apps/cms/src/lib/validations/tags.ts` | `{ db }` from `@marble/db` | `tag.findMany` | — |
| `apps/cms/src/utils/usage/media.ts` | `{ db }` from `@marble/db` | `media.aggregate`, `subscription.findFirst`, `organization.findFirst`, `usageEvent.create` | — |

### Config (non-query)

| File | Import | Notes |
| --- | --- | --- |
| `apps/cms/next.config.ts` | string `"@marble/db"` in `transpilePackages` | Build/transpile only; no client usage |

---

## Model rollup (CMS `db.*` / `tx.*`)

| Prisma client model | Physical table (`@@map` or default) | CMS operations observed |
| --- | --- | --- |
| `organization` | `workspace` | `findMany`, `findFirst`, `findUnique`, `update` |
| `user` | `user` | `findUnique`, `update` |
| `member` | `member` | `findFirst` |
| `account` | `account` | `findMany`, `delete` |
| `subscription` | `subscription` | `findFirst`, `findUnique`, `create`, `updateMany` |
| `post` | `post` | `findMany`, `findFirst`, `count`, `create`, `update`, `delete` |
| `tag` | `tag` | `findMany`, `findFirst`, `create`, `update`, `delete` |
| `category` | `category` | `findMany`, `findFirst`, `create`, `update`, `delete` |
| `author` | `author` | `findMany`, `findFirst`, `findUnique`, `count`, `create`, `update`, `delete` |
| `authorSocial` (nested) | `author_social` | via `author.create`/`update`/`include` → `socials` (no direct `db.authorSocial` calls) |
| `media` | `media` | `findMany`, `findFirst`, `count`, `aggregate`, `create`, `update`, `deleteMany` |
| `shareLink` | `ShareLink` (**no `@@map`**; PascalCase table) | `findFirst`, `create` |
| `field` | `field` | `findMany`, `findFirst`, `aggregate`, `create`, `update`, `delete` |
| `fieldValue` | `field_value` | `findMany`, `count`, `upsert`, `deleteMany` |
| `fieldOption` (nested) | `field_option` | via `field.create`/`update` `options` nested writes |
| `apiKey` | `api_key` | `findMany`, `findFirst`, `create`, `update`, `delete` |
| `webhookEndpoint` | `webhook_endpoint` | `findMany`, `findFirst`, `create`, `update`, `delete` |
| `webhookDelivery` | `webhook_delivery` | `findMany`, `count` |
| `usageEvent` | `usage_event` | `findMany`, `findFirst`, `count`, `groupBy`, `create` |
| `userNotificationPreferences` | `user_notification_preferences` | `findUnique`, `upsert` |
| `workspaceNotificationPreferences` | `workspace_notification_preferences` | `upsert` |
| `exportJob` | `export_job` | `findMany`, `findUnique`, `create`, `update` |
| `importJob` | `import_job` | `findMany`, `create`, `update` |

**Implicit M2M join tables** used by post tag/author `connect` / `set`:

| Join table | Relates |
| --- | --- |
| `_PostToTag` | `post` ↔ `tag` |
| `_PostToAuthor` | `post` ↔ `author` |

**Models present in schema but not directly queried by CMS application code** (still may be touched by Better Auth, jobs, or API):  
`Verification`, `Invitation` (Better Auth organization plugin), `Session` (Better Auth + Redis secondary storage), `UsageAlert`, `WorkspaceEvent`, `WebhookDeliveryAttempt`, `ImportItem`.

---

## `@marble/db/browser` exports used by CMS

| Export | Files |
| --- | --- |
| `FieldType` (type, aliased `PrismaFieldType`) | `app/api/fields/route.ts` |
| `Prisma` (`TransactionIsolationLevel`) | `app/api/fields/[id]/route.ts` |
| `UsageEventType` | `lib/queries/dashboard/usage.ts` |
| `SubscriptionStatus` | `lib/queries/workspace.ts`, `lib/polar/subscription.canceled.ts`, `lib/polar/subscription.revoked.ts`, `lib/polar/utils.ts` |
| `PlanType` | `lib/polar/utils.ts` |
| `SubscriptionRecurringInterval` (type) | `lib/polar/utils.ts` |

---

## 2. `$transaction` sites

No `$queryRaw` / `$executeRaw` in CMS. All interactive / batch transactions:

| # | File | Pattern | Isolation | Brief description |
| --- | --- | --- | --- | --- |
| 1 | `apps/cms/src/app/api/fields/[id]/route.ts` | Interactive `db.$transaction(async (tx) => { … }, opts)` | **`Prisma.TransactionIsolationLevel.Serializable`** | Before changing field type/options, count existing `fieldValue` rows; if any, abort. Otherwise update `field` and rewrite nested `options` (`deleteMany` + `create`) atomically. |
| 2 | `apps/cms/src/app/api/posts/route.ts` | Interactive `db.$transaction(async (tx) => { … })` | default | Create `post` (connect tags + authors), then upsert/delete `fieldValue` rows for custom fields; throw to roll back on validation failure. |
| 3 | `apps/cms/src/app/api/posts/[id]/route.ts` | Interactive `db.$transaction(async (tx) => { … })` | default | Update `post` (set tags + authors), then upsert/delete related `fieldValue` rows in the same transaction. |
| 4 | `apps/cms/src/app/api/posts/[id]/fields/route.ts` | Batch `db.$transaction(operations)` where `operations` is an array of `fieldValue.deleteMany` / `upsert` promises | default | Persist a full custom-field value set for one post as a single batch transaction (no interactive callback). |

**Migration note:** keep interactive `db.transaction(async (tx) => …)` on neon-serverless WebSocket for sites 1–3; do not rewrite to neon-http `batch()` during cutover. Site 4 can become an equivalent Drizzle batch/transaction on the same WS client.

---

## 3. Better Auth models and physical table names

Better Auth in CMS (`apps/cms/src/lib/auth/server.ts`) uses:

```ts
database: prismaAdapter(db, { provider: "postgresql" })
```

plus the `organization` and `emailOTP` plugins, Redis `secondaryStorage`, and `session.storeSessionInDatabase: true`.

There is also a top-level Better Auth option:

```ts
organization: {
  modelName: "workspace",
},
```

which aligns the org plugin naming with the physical `workspace` table (Prisma model remains `Organization` → client `db.organization`).

### Core + organization plugin tables

| Better Auth concept | Prisma model | Physical table (`@@map` / default) |
| --- | --- | --- |
| User | `User` | `user` |
| Session | `Session` | `session` |
| Account (OAuth / credential) | `Account` | `account` |
| Verification (OTP / email tokens) | `Verification` | `verification` |
| Organization (workspace) | `Organization` | **`workspace`** |
| Member | `Member` | `member` |
| Invitation | `Invitation` | `invitation` |

### Full Prisma model → physical table map (`packages/db/prisma/schema.prisma`)

| Prisma model | `@@map` / physical name |
| --- | --- |
| `Subscription` | `subscription` |
| `Organization` | `workspace` |
| `Post` | `post` |
| `ShareLink` | **`ShareLink`** (no `@@map`) |
| `Tag` | `tag` |
| `Media` | `media` |
| `Category` | `category` |
| `WebhookEndpoint` | `webhook_endpoint` |
| `User` | `user` |
| `UserNotificationPreferences` | `user_notification_preferences` |
| `Author` | `author` |
| `AuthorSocial` | `author_social` |
| `Session` | `session` |
| `Account` | `account` |
| `Verification` | `verification` |
| `Member` | `member` |
| `WorkspaceNotificationPreferences` | `workspace_notification_preferences` |
| `Invitation` | `invitation` |
| `UsageEvent` | `usage_event` |
| `UsageAlert` | `usage_alert` |
| `ApiKey` | `api_key` |
| `Field` | `field` |
| `FieldOption` | `field_option` |
| `FieldValue` | `field_value` |
| `WorkspaceEvent` | `workspace_event` |
| `WebhookDelivery` | `webhook_delivery` |
| `WebhookDeliveryAttempt` | `webhook_delivery_attempt` |
| `ExportJob` | `export_job` |
| `ImportJob` | `import_job` |
| `ImportItem` | `import_item` |

### Schema features that matter for Drizzle parity

**Json columns:** `Post.contentJson`, `Post.attribution`, `WorkspaceEvent.payload`, `ExportJob.scope`, `ImportJob.mapping`, `ImportItem.contentJson` / `rawTags` / `resolvedTagIds` / `errors`.

**`@updatedAt`:** present on most mutable models (subscription, organization, post, share link, taxonomy, media, webhooks, authors/socials, notification prefs, api keys, fields/options/values, webhook delivery, export/import jobs & items). Session/Account/User/Invitation/Verification/UsageEvent/WorkspaceEvent rely on application-set timestamps where applicable.

**Enums (Postgres enums via Prisma):**  
`PostStatus`, `PlanType`, `SubscriptionRecurringInterval`, `SubscriptionStatus`, `WorkspaceEventType`, `WorkspaceEventSource`, `WorkspaceEventActorType`, `WorkspaceEventResourceType`, `PayloadFormat`, `MediaType`, `UsageEventType`, `UsageAlertKind`, `ApiKeyType`, `ApiScope`, `FieldType`, `WebhookDeliveryStatus`, `ExportJobStatus`, `ExportFormat`, `ImportSource`, `ImportJobStatus`, `ImportFormat`, `ImportItemStatus`.

**Composite uniques used in CMS queries:** e.g. `Post` `[workspaceId, slug]`, `Author` `[workspaceId, slug]` / `[workspaceId, userId]`, `Field` `[workspaceId, key]` / `[id, workspaceId]`, `FieldValue` `[postId, fieldId]`, `Tag`/`Category` `[workspaceId, slug]`.

---

## 4. Golden paths (from migration plan)

Smoke these after every migrated slice (and as Phase 3 exit with auth soak):

1. **Login / session restore** — existing session cookie still authenticates after adapter/query changes; no Redis flush.
2. **Create workspace** — Better Auth `createOrganization` → physical `workspace` + member + default author hook.
3. **CRUD post with custom fields** — covers interactive post txs + fieldValue upserts/deletes.
4. **Media upload** — upload complete → `media.create` (+ usage / org side effects as applicable).
5. **Polar webhook** — subscription created/updated/canceled/revoked handlers writing `subscription`.
6. **API key auth on public API** — listed in the plan’s golden paths; **public API lives in `apps/api` and is OUT OF SCOPE for PR1** (keep as a cross-app smoke after CMS, or defer assertion to PR2). Still ensure CMS key CRUD (`apiKey`) remains correct in PR1.
7. **Invite member / switch org** — invitation + `activeOrganizationId` / workspace switching.

Phase 2 domain order (plan) for incremental CMS migration:

1. Read-only dashboard queries (`lib/queries/`)
2. Taxonomy (tags / categories / authors)
3. Media / share links
4. Posts + custom fields (transactions)
5. Workspaces / members / invitations (auth-adjacent)
6. Billing / Polar / usage
7. Import / export jobs
8. Better Auth adapter (Phase 3)

---

## 5. Explicit PR1 out-of-scope note

> **`apps/api` and `apps/jobs` are OUT OF SCOPE for PR1.**

They continue to use `@marble/db` (Hyperdrive / `PrismaPg` client factories). PR1 delivers Phase 0–3 foundation + **CMS only** (queries → Better Auth). Workers move in a later PR after CMS auth soak is green. Prisma remains installed for rollback and for those apps until their cutover.

---

## Appendix: suggested Phase 2 file groups

| Slice | Primary files |
| --- | --- |
| Dashboard reads | `lib/queries/dashboard/*`, `lib/queries/user.ts`, `lib/queries/workspace.ts` |
| Taxonomy | `app/api/tags/**`, `app/api/categories/**`, `app/api/authors/**`, `lib/validations/tags.ts` |
| Media / share | `app/api/media/**`, `app/api/upload/complete/**`, `app/api/share/**`, `utils/usage/media.ts` |
| Posts + fields | `app/api/posts/**`, `app/api/fields/**` (**all 4 `$transaction` sites**) |
| Workspaces / members / user | `app/api/workspaces/**`, `app/api/user/**`, `app/api/accounts/**`, `lib/auth/access.ts`, `lib/auth/hooks.ts` |
| Billing / usage | `lib/polar/**`, `lib/subscription/access.ts`, `app/api/polar/**`, usage dashboard queries |
| Import / export | `app/api/data/import/**`, `app/api/data/export/**` |
| Better Auth | `lib/auth/server.ts` (`prismaAdapter` → `drizzleAdapter`) |

---

*Generated for Phase 0 inventory. Move/copy under `packages/drizzle/src/__parity__/` once `@marble/drizzle` exists.*
