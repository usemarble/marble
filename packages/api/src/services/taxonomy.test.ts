import { category, tag, workspaceEvent } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import { asc, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { categoriesRouter } from "../routers/categories";
import { tagsRouter } from "../routers/tags";
import {
  createTestContext,
  seedMember,
  seedUser,
  seedWorkspace,
  sessionFor,
  testEnv,
} from "../testing";

let testDb: TestDatabase;
const redis = new Redis({ url: testEnv.REDIS_URL, token: testEnv.REDIS_TOKEN });
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

for (const [resource, singular, router, table] of [
  ["tags", "tag", tagsRouter, tag],
  ["categories", "category", categoriesRouter, category],
] as const) {
  async function fixture() {
    const user = await seedUser(testDb.db);
    const workspace = await seedWorkspace(testDb.db, user.id);
    const request = createTestContext(testDb.db, { session: sessionFor(user) });
    const client = createRouterClient(router, { context: request.context });
    return {
      ...request,
      client,
      user,
      input: {
        workspaceId: workspace.id,
        name: "News",
        slug: "news",
        description: "Latest news",
      },
    };
  }
  function eventRows(workspaceId: string) {
    return testDb.db.query.workspaceEvent.findMany({
      where: eq(workspaceEvent.workspaceId, workspaceId),
      orderBy: [asc(workspaceEvent.createdAt), asc(workspaceEvent.id)],
    });
  }
  const keys = (workspaceId: string) => [
    `cache:${workspaceId}:${resource}:v1:list`,
    `cache:${workspaceId}:${resource}:dash:list`,
    `cache:${workspaceId}:posts:v1:list`,
    `cache:${workspaceId}:posts:dash:list`,
  ];
  describe(`dashboard ${resource}`, () => {
    it("create, update and delete emit the CMS events and clear both views and related posts", async () => {
      const { client, input, user, events, flush } = await fixture();
      const cacheKeys = keys(input.workspaceId);
      const unrelated = `cache:${input.workspaceId}:media:v1:list`;
      await redis.set(unrelated, "keep");
      const prime = () =>
        Promise.all(cacheKeys.map((key) => redis.set(key, "stale")));
      await prime();
      const { id } = await client.create(input);
      await flush();
      expect(await Promise.all(cacheKeys.map((key) => redis.get(key)))).toEqual(
        [null, null, null, null]
      );
      expect(await client.list({ workspaceId: input.workspaceId })).toEqual([
        {
          id,
          name: "News",
          slug: "news",
          description: "Latest news",
          postsCount: 0,
        },
      ]);
      await prime();
      await client.update({ ...input, id, name: "Edited" });
      await flush();
      expect(await Promise.all(cacheKeys.map((key) => redis.get(key)))).toEqual(
        [null, null, null, null]
      );
      await prime();
      await client.delete({ workspaceId: input.workspaceId, id });
      await flush();
      expect(await Promise.all(cacheKeys.map((key) => redis.get(key)))).toEqual(
        [null, null, null, null]
      );
      const rows = await eventRows(input.workspaceId);
      expect(rows.map((row) => row.type)).toEqual([
        `${singular}_created`,
        `${singular}_updated`,
        `${singular}_deleted`,
      ]);
      for (const row of rows) {
        expect(row).toMatchObject({
          source: "dashboard",
          actorType: "user",
          actorId: user.id,
          resourceType: singular,
          resourceId: id,
          payload: { id, slug: "news", description: "Latest news" },
        });
        expect(row.enqueuedAt).toBeInstanceOf(Date);
      }
      expect(rows[1]?.payload).toHaveProperty("changes", [
        "name",
        "slug",
        "description",
      ]);
      expect(rows[2]?.payload).toMatchObject({ name: "Edited" });
      expect(events.sent).toEqual(
        rows.map((row) => ({ type: "event.fanout", eventId: row.id }))
      );
      expect(await client.list({ workspaceId: input.workspaceId })).toEqual([]);
      expect(await redis.get(unrelated)).toBe("keep");
      await redis.del(unrelated);
    });

    it("a commit failure rolls back the resource and outbox, sends nothing and clears nothing", async () => {
      const { client, input, events, flush } = await fixture();
      const cacheKeys = keys(input.workspaceId);
      await Promise.all(cacheKeys.map((key) => redis.set(key, "keep")));
      await testDb.db.execute(
        sql.raw(
          `CREATE FUNCTION reject_${singular}_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'commit rejected'; END $$`
        )
      );
      await testDb.db.execute(
        sql.raw(
          `CREATE CONSTRAINT TRIGGER reject_${singular}_commit AFTER INSERT ON ${singular} DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reject_${singular}_commit()`
        )
      );
      try {
        await expect(client.create(input)).rejects.toBeDefined();
        await flush();
        expect(
          await testDb.db
            .select()
            .from(table)
            .where(eq(table.workspaceId, input.workspaceId))
        ).toEqual([]);
        expect(await eventRows(input.workspaceId)).toEqual([]);
        expect(events.sent).toEqual([]);
        expect(
          await Promise.all(cacheKeys.map((key) => redis.get(key)))
        ).toEqual(["keep", "keep", "keep", "keep"]);
      } finally {
        await testDb.db.execute(
          sql.raw(`DROP TRIGGER reject_${singular}_commit ON ${singular}`)
        );
        await testDb.db.execute(
          sql.raw(`DROP FUNCTION reject_${singular}_commit()`)
        );
        await redis.del(...cacheKeys);
      }
    });

    it("foreign IDs are excluded from lists and cannot be changed or deleted", async () => {
      const home = await fixture();
      const other = await fixture();
      const { id } = await other.client.create(other.input);
      await other.flush();
      const notFound = {
        code: "NOT_FOUND",
        status: 404,
        message: `${singular === "tag" ? "Tag" : "Category"} not found`,
      };
      expect(
        await home.client.list({ workspaceId: home.input.workspaceId })
      ).toEqual([]);
      if (singular === "tag") {
        await expect(
          home.client.update({ ...home.input, id })
        ).rejects.toMatchObject(notFound);
      }
      await expect(
        home.client.delete({ workspaceId: home.input.workspaceId, id })
      ).rejects.toMatchObject(notFound);
      await home.flush();
      expect(await eventRows(home.input.workspaceId)).toEqual([]);
      expect(home.events.sent).toEqual([]);
      expect(
        await other.client.list({ workspaceId: other.input.workspaceId })
      ).toHaveLength(1);
    });

    it("rejects a caller without membership with 403; members retain the CMS write access", async () => {
      const { client, input, user, flush } = await fixture();
      const otherWorkspace = await seedWorkspace(testDb.db);
      await expect(
        client.create({ ...input, workspaceId: otherWorkspace.id })
      ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
      await expect(
        client.list({ workspaceId: otherWorkspace.id })
      ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
      await seedMember(testDb.db, otherWorkspace.id, user.id, "member");
      await client.create({ ...input, workspaceId: otherWorkspace.id });
      await flush();
      expect(
        await client.list({ workspaceId: otherWorkspace.id })
      ).toHaveLength(1);
    });
  });
}
