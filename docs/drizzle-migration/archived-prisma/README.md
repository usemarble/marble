# Archived Prisma migration history

Production / staging tables were created and evolved under Prisma (`packages/db`) until the Drizzle cutover.

As of PR3:

- **Schema owner:** Drizzle Kit (`packages/drizzle`)
- **Runtime:** `@marble/drizzle` (CMS neon-serverless; API/jobs Hyperdrive `pg`)
- **This folder:** read-only historical record of Prisma SQL migrations + the final `schema.prisma`

Do **not** run `prisma migrate` against shared environments. New DDL goes through Drizzle Kit only.
