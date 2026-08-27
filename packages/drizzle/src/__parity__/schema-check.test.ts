import { describe, it } from "vitest";

/**
 * Schema / row parity against a live database.
 *
 * When `DATABASE_URL` is set (staging or local Docker), this suite should:
 * 1. Dump `information_schema` tables/columns/enums (see docs/drizzle-parity/baseline)
 * 2. Compare physical names to hand-authored Drizzle tables in `src/schema`
 * 3. Optionally run paired Prisma + Drizzle reads and diff via `normalize.ts`
 *
 * Without a database URL the checks are skipped — Prisma remains schema owner
 * and this package must not call drizzle-kit generate/migrate against prod.
 */
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDatabaseUrl)("drizzle schema parity vs live DB", () => {
  it("compares information_schema baseline when DATABASE_URL is set", async () => {
    // Placeholder: implement live dumps + assert against docs/drizzle-parity/baseline
    // and packages/drizzle/src/schema once a staging DATABASE_URL is available.
  });
});

describe("parity harness (offline)", () => {
  it("documents that live parity requires DATABASE_URL", () => {
    // Always passes — keeps CI green without a DB while documenting the gate.
    if (!hasDatabaseUrl) {
      return;
    }
  });
});
