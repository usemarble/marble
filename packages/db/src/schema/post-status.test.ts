import { sql } from "drizzle-orm";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createTestDatabase, type TestDatabase } from "../testing";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

it("migrates the scheduled enum and global status/go-live index together", async () => {
  const statuses = await testDb.db.execute(
    sql`SELECT unnest(enum_range(NULL::"PostStatus"))::text AS status`
  );
  expect(statuses.rows).toEqual([
    { status: "published" },
    { status: "draft" },
    { status: "scheduled" },
  ]);
  const indexes = await testDb.db.execute(
    sql`SELECT indexdef FROM pg_indexes WHERE tablename = 'post' AND indexname = 'post_status_publishedAt_idx'`
  );
  expect(indexes.rows).toEqual([
    {
      indexdef:
        'CREATE INDEX "post_status_publishedAt_idx" ON public.post USING btree (status, "publishedAt")',
    },
  ]);
});
