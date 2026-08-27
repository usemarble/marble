# Drizzle parity baselines

Snapshots used to verify the hand-authored `@marble/drizzle` schema against the live Postgres catalog before any Drizzle kit pull.

## Checked in

| File | Purpose |
| --- | --- |
| `prisma-schema.prisma` | Copy of `packages/db/prisma/schema.prisma` at the time of the coexistence package. Prisma remains the schema owner. |

## Live dumps (require `DATABASE_URL`)

There is no Docker / `DATABASE_URL` in the cloud agent environment used for PR1 scaffolding. Before running `drizzle-kit pull --init` (or similar) on **staging**, dump the live catalog so you can detect drift:

```bash
# Tables + columns
psql "$DATABASE_URL" -c "\copy (
  SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position
) TO 'docs/drizzle-parity/baseline/information_schema_columns.csv' CSV HEADER"

# Enums
psql "$DATABASE_URL" -c "\copy (
  SELECT t.typname AS enum_name, e.enumlabel AS enum_value, e.enumsortorder
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  ORDER BY t.typname, e.enumsortorder
) TO 'docs/drizzle-parity/baseline/pg_enums.csv' CSV HEADER"
```

## Rules

1. Capture baselines on staging **before** `drizzle-kit pull --init`.
2. Never run `drizzle-kit generate` / `migrate` against production — Prisma owns migrations.
3. Compare dumps to `packages/drizzle/src/schema` (and to `prisma-schema.prisma`) when validating parity.
4. Run package tests with `DATABASE_URL` set to enable the skipped suite in `packages/drizzle/src/__parity__/schema-check.test.ts`.
