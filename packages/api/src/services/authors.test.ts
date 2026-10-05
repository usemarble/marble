import { createRecordId } from "@marble/db/id";
import {
  author,
  authorSocial,
  subscription,
  workspaceEvent,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import { asc, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authorsRouter } from "../routers/authors";
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
async function fixture(paid = false) {
  const user = await seedUser(testDb.db);
  const workspace = await seedWorkspace(testDb.db, user.id);
  if (paid) {
    await testDb.db.insert(subscription).values({
      id: createRecordId(),
      workspaceId: workspace.id,
      userId: user.id,
      plan: "pro",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
      cancelAtPeriodEnd: false,
      polarId: createRecordId(),
    });
  }
  const request = createTestContext(testDb.db, { session: sessionFor(user) });
  const client = createRouterClient(authorsRouter, {
    context: request.context,
  });
  return {
    ...request,
    client,
    user,
    input: {
      workspaceId: workspace.id,
      name: "Writer",
      slug: "writer",
      bio: "A biography",
      role: "Editor",
      email: "",
      image: null,
      socials: [{ platform: "website" as const, url: "example.com" }],
    },
  };
}
function eventRows(workspaceId: string) {
  return testDb.db.query.workspaceEvent.findMany({
    where: eq(workspaceEvent.workspaceId, workspaceId),
    orderBy: [asc(workspaceEvent.createdAt), asc(workspaceEvent.id)],
  });
}
const keys = (workspaceId: string) =>
  ["authors", "posts"].flatMap((resource) =>
    ["v1", "dash"].map(
      (view) => `cache:${workspaceId}:${resource}:${view}:list`
    )
  );
describe("dashboard authors", () => {
  it("writes emit CMS events, preserve socials and clear authors and related post caches", async () => {
    const { client, input, user, events, flush } = await fixture();
    const cacheKeys = keys(input.workspaceId);
    const prime = () =>
      Promise.all(cacheKeys.map((key) => redis.set(key, "stale")));
    const cleared = async () => {
      await flush();
      expect(await Promise.all(cacheKeys.map((key) => redis.get(key)))).toEqual(
        [null, null, null, null]
      );
    };
    await prime();
    const created = await client.create(input);
    await cleared();
    expect(created).toMatchObject({
      name: "Writer",
      email: null,
      socials: [{ url: "https://example.com", platform: "website" }],
    });
    await prime();
    const { socials: _socials, ...withoutSocials } = input;
    const preserved = await client.update({
      ...withoutSocials,
      id: created.id,
      name: "Edited",
    });
    await cleared();
    expect(preserved.socials).toEqual(created.socials);
    await prime();
    const updated = await client.update({
      ...input,
      id: created.id,
      socials: [{ platform: "github", url: "github.com/test" }],
    });
    await cleared();
    expect(updated.socials).toMatchObject([
      { url: "https://github.com/test", platform: "github" },
    ]);
    expect(updated.socials[0]?.id).not.toBe(created.socials[0]?.id);
    await prime();
    expect(
      await client.delete({ workspaceId: input.workspaceId, id: created.id })
    ).toBe(created.id);
    await cleared();
    const rows = await eventRows(input.workspaceId);
    expect(rows.map((row) => row.type)).toEqual([
      "author_created",
      "author_updated",
      "author_updated",
      "author_deleted",
    ]);
    for (const row of rows) {
      expect(row).toMatchObject({
        source: "dashboard",
        resourceType: "author",
        resourceId: created.id,
        actorType: "user",
        actorId: user.id,
      });
      expect(row.enqueuedAt).toBeInstanceOf(Date);
    }
    expect(rows[0]?.payload).toMatchObject({
      socials: [{ url: "https://example.com", platform: "website" }],
    });
    expect(rows[1]?.payload).toHaveProperty("changes", [
      "name",
      "role",
      "bio",
      "image",
      "email",
      "slug",
    ]);
    expect(rows[3]?.payload).toMatchObject({
      name: "Writer",
      socials: [{ url: "https://github.com/test", platform: "github" }],
    });
    expect(events.sent).toEqual(
      rows.map((row) => ({ type: "event.fanout", eventId: row.id }))
    );
    expect(await client.list({ workspaceId: input.workspaceId })).toEqual([]);
    expect(
      await testDb.db
        .select()
        .from(authorSocial)
        .where(eq(authorSocial.authorId, created.id))
    ).toEqual([]);
  });
  it("a commit failure rolls back the author, socials and outbox and clears nothing", async () => {
    const { client, input, events, flush } = await fixture();
    const cacheKeys = keys(input.workspaceId);
    await Promise.all(cacheKeys.map((key) => redis.set(key, "keep")));
    await testDb.db.execute(
      sql`CREATE FUNCTION reject_author_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'commit rejected'; END $$`
    );
    await testDb.db.execute(
      sql`CREATE CONSTRAINT TRIGGER reject_author_commit AFTER INSERT ON author DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reject_author_commit()`
    );
    const socialsBefore = await testDb.db.select().from(authorSocial);
    try {
      await expect(client.create(input)).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create author",
      });
      await flush();
      expect(
        await testDb.db
          .select()
          .from(author)
          .where(eq(author.workspaceId, input.workspaceId))
      ).toEqual([]);
      expect(await testDb.db.select().from(authorSocial)).toEqual(
        socialsBefore
      );
      expect(await eventRows(input.workspaceId)).toEqual([]);
      expect(events.sent).toEqual([]);
      expect(await Promise.all(cacheKeys.map((key) => redis.get(key)))).toEqual(
        ["keep", "keep", "keep", "keep"]
      );
    } finally {
      await testDb.db.execute(sql`DROP TRIGGER reject_author_commit ON author`);
      await testDb.db.execute(sql`DROP FUNCTION reject_author_commit()`);
      await redis.del(...cacheKeys);
    }
  });
  it("foreign IDs return 404 and cannot change authors or socials", async () => {
    const home = await fixture();
    const other = await fixture();
    const created = await other.client.create(other.input);
    await other.flush();
    const notFound = {
      code: "NOT_FOUND",
      status: 404,
      message: "Author not found",
    };
    expect(
      await home.client.list({ workspaceId: home.input.workspaceId })
    ).toEqual([]);
    await expect(
      home.client.update({ ...home.input, id: created.id })
    ).rejects.toMatchObject(notFound);
    await expect(
      home.client.delete({
        workspaceId: home.input.workspaceId,
        id: created.id,
      })
    ).rejects.toMatchObject(notFound);
    await home.flush();
    expect(home.events.sent).toEqual([]);
    expect(await eventRows(home.input.workspaceId)).toEqual([]);
    expect(
      (await other.client.list({ workspaceId: other.input.workspaceId }))[0]
        ?.socials
    ).toMatchObject([
      { id: created.socials[0]?.id, url: "https://example.com" },
    ]);
  });
  it("preserves the free-plan limit and counts only active authors", async () => {
    const { client, input, events, flush } = await fixture();
    const created = await client.create(input);
    await flush();
    await expect(
      client.create({ ...input, slug: "second" })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
      message: "Author limit reached. Your current plan allows 1 author.",
    });
    await flush();
    expect(events.sent).toHaveLength(1);
    await testDb.db
      .update(author)
      .set({ isActive: false })
      .where(eq(author.id, created.id));
    await client.create({ ...input, slug: "second" });
    await flush();
    expect(await client.list({ workspaceId: input.workspaceId })).toHaveLength(
      1
    );
  });
  it("rejects non-members with 403 and retains member write access", async () => {
    const { client, input, user, flush } = await fixture();
    const other = await seedWorkspace(testDb.db);
    await expect(
      client.create({ ...input, workspaceId: other.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
    await expect(client.list({ workspaceId: other.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
    await seedMember(testDb.db, other.id, user.id, "member");
    await client.create({ ...input, workspaceId: other.id });
    await flush();
    expect(await client.list({ workspaceId: other.id })).toHaveLength(1);
  });
  it("paid authors keep the CMS create and update conflict messages", async () => {
    const { client, input, flush } = await fixture(true);
    await client.create(input);
    await flush();
    await expect(client.create(input)).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Author with this name already exists",
    });
    const second = await client.create({ ...input, slug: "second" });
    await flush();
    await expect(
      client.update({ ...input, id: second.id })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Slug already in use",
    });
  });
});
