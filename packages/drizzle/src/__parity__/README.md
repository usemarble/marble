# Drizzle ↔ Prisma parity (`@marble/drizzle`)

Notes from Phase 0 inventory (`docs/drizzle-parity/inventory.md`), kept next to the package for cutover work.

## Constraints

- **Prisma remains schema owner.** Do not run `drizzle-kit generate` / `migrate` against production.
- Hand-authored schema in `src/schema/` matches physical `@@map` names from `packages/db/prisma/schema.prisma`.
- CMS client uses **`drizzle-orm/neon-serverless`** (WebSocket `Pool` + `ws`) for interactive transactions — not `neon-http`.
- Hyperdrive / `node-postgres` client is a stub at `@marble/drizzle/hyperdrive` for PR2.

## Physical table names (CMS + Better Auth)

| Prisma model | Physical table |
| --- | --- |
| Organization | `workspace` |
| User | `user` |
| Session | `session` |
| Account | `account` |
| Verification | `verification` |
| Member | `member` |
| Invitation | `invitation` |
| Post | `post` |
| Tag | `tag` |
| Category | `category` |
| Author | `author` |
| AuthorSocial | `author_social` |
| Media | `media` |
| ShareLink | `ShareLink` (no `@@map` — PascalCase) |
| Field / FieldOption / FieldValue | `field` / `field_option` / `field_value` |
| Subscription | `subscription` |
| ApiKey | `api_key` |
| WebhookEndpoint / Delivery / Attempt | `webhook_endpoint` / `webhook_delivery` / `webhook_delivery_attempt` |
| UsageEvent / UsageAlert | `usage_event` / `usage_alert` |
| UserNotificationPreferences | `user_notification_preferences` |
| WorkspaceNotificationPreferences | `workspace_notification_preferences` |
| WorkspaceEvent | `workspace_event` |
| ExportJob / ImportJob / ImportItem | `export_job` / `import_job` / `import_item` |
| M2M | `_PostToTag`, `_PostToAuthor` |

## How to run parity later

1. **Baseline** — copy of Prisma schema lives at `docs/drizzle-parity/baseline/prisma-schema.prisma`. Live `information_schema` dumps require `DATABASE_URL` (see that folder’s README) and must be captured **before** any `drizzle-kit pull --init` on staging.
2. **Normalize** — use `normalize.ts` (`datesToIso`, `sortById`) when comparing Prisma vs Drizzle row payloads.
3. **Tests** — `schema-check.test.ts` skips unless `DATABASE_URL` is set:

```bash
cd packages/drizzle
DATABASE_URL=postgres://... pnpm test
```

4. **Golden paths** (from inventory) after CMS routes migrate: login/session, create workspace, CRUD post + custom fields, media upload, Polar webhooks, invite/switch org.

## Scope reminder

PR1 is **package only** — do not migrate `apps/cms` routes here. `apps/api` / `apps/jobs` stay on `@marble/db` until PR2. Do not remove `@marble/db`.

See full file-by-file CMS inventory: `docs/drizzle-parity/inventory.md`.
