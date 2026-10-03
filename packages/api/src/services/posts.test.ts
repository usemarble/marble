import { createRecordId } from "@marble/db/id";
import {
  author,
  category,
  field,
  post,
  workspaceEvent,
} from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import { asc, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { postsRouter } from "../routers/posts";
import {
  createTestContext,
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

async function fixture() {
  const user = await seedUser(testDb.db);
  const workspace = await seedWorkspace(testDb.db, user.id);
  const categoryId = createRecordId();
  const authorId = createRecordId();
  await testDb.db.insert(category).values({
    id: categoryId,
    name: "News",
    slug: "news",
    workspaceId: workspace.id,
  });
  await testDb.db.insert(author).values({
    id: authorId,
    name: user.name,
    slug: "writer",
    workspaceId: workspace.id,
    userId: user.id,
  });
  const request = createTestContext(testDb.db, { session: sessionFor(user) });
  const client = createRouterClient(postsRouter, { context: request.context });
  const input = {
    workspaceId: workspace.id,
    title: "Hello",
    slug: createRecordId(),
    description: "A post",
    content: "<p>Hello</p>",
    contentJson: JSON.stringify({ type: "doc", content: [] }),
    status: "draft" as const,
    featured: false,
    coverImage: null,
    publishedAt: new Date("2025-01-02T03:04:05Z"),
    tags: [],
    authors: [authorId],
    category: categoryId,
    customFields: {},
  };
  return { ...request, client, input, user };
}

function eventRows(workspaceId: string) {
  return testDb.db.query.workspaceEvent.findMany({
    where: eq(workspaceEvent.workspaceId, workspaceId),
    orderBy: [asc(workspaceEvent.createdAt), asc(workspaceEvent.id)],
  });
}

describe("dashboard post writes", () => {
  it.each(["draft", "published"] as const)(
    "creating a %s emits the CMS event and invalidates posts",
    async (status) => {
      const { client, input, user, events, flush } = await fixture();
      const key = `cache:${input.workspaceId}:posts:v1:list`;
      await redis.set(key, "stale");

      const { id } = await client.create({ ...input, status });
      await flush();

      const [event] = await eventRows(input.workspaceId);
      expect(event).toMatchObject({
        type: status === "published" ? "post_published" : "post_created",
        source: "dashboard",
        actorType: "user",
        actorId: user.id,
        resourceType: "post",
        resourceId: id,
        payload: {
          id,
          title: input.title,
          slug: input.slug,
          status,
          publishedAt: input.publishedAt.toISOString(),
        },
      });
      expect(event?.enqueuedAt).toBeInstanceOf(Date);
      expect(events.sent).toEqual([
        { type: "event.fanout", eventId: event?.id },
      ]);
      expect(await redis.get(key)).toBeNull();
    }
  );

  it("emits updated, published, unpublished and deleted according to the CMS transitions", async () => {
    const { client, input, events, flush } = await fixture();
    const { id } = await client.create(input);
    await flush();
    const transitions = [
      ["draft", "post_updated"],
      ["published", "post_published"],
      ["published", "post_updated"],
      ["draft", "post_unpublished"],
    ] as const;
    for (const [status, eventType] of transitions) {
      const key = `cache:${input.workspaceId}:posts:v1:${id}`;
      await redis.set(key, "stale");
      const values = { ...input, id, status, title: `Edited ${eventType}` };
      await client.update(values);
      await flush();
      const rows = await eventRows(input.workspaceId);
      const latest = rows.at(-1);
      expect(latest).toMatchObject({
        type: eventType,
        resourceId: id,
        source: "dashboard",
        payload: {
          title: values.title,
          status,
          publishedAt: input.publishedAt.toISOString(),
        },
      });
      expect(latest?.enqueuedAt).toBeInstanceOf(Date);
      if (eventType === "post_updated") {
        expect(latest?.payload).toHaveProperty("changes", [
          "title",
          "coverImage",
          "description",
          "slug",
          "content",
          "contentJson",
          "tags",
          "authors",
          "category",
          "status",
          "featured",
          "publishedAt",
          "customFields",
        ]);
      } else {
        expect(latest?.payload).not.toHaveProperty("changes");
      }
      expect(await redis.get(key)).toBeNull();
    }

    const key = `cache:${input.workspaceId}:posts:v1:${id}`;
    await redis.set(key, "stale");
    await client.delete({ workspaceId: input.workspaceId, id });
    await flush();
    const rows = await eventRows(input.workspaceId);
    expect(rows.map((event) => event.type)).toEqual([
      "post_created",
      "post_updated",
      "post_published",
      "post_updated",
      "post_unpublished",
      "post_deleted",
    ]);
    expect(events.sent).toEqual(
      rows.map((event) => ({ type: "event.fanout", eventId: event.id }))
    );
    expect(rows.at(-1)?.payload).toMatchObject({ id, status: "draft" });
    expect(
      await testDb.db.query.post.findFirst({ where: eq(post.id, id) })
    ).toBeUndefined();
    expect(await redis.get(key)).toBeNull();
  });

  it("a custom-field update emits post_updated and invalidates posts", async () => {
    const { client, input, user, events, flush } = await fixture();
    const { id } = await client.create(input);
    await flush();
    const fieldId = createRecordId();
    await testDb.db.insert(field).values({
      id: fieldId,
      workspaceId: input.workspaceId,
      key: "subtitle",
      name: "Subtitle",
      type: "text",
    });
    const key = `cache:${input.workspaceId}:posts:v1:${id}`;
    await redis.set(key, "stale");

    await client.fields.update({
      workspaceId: input.workspaceId,
      id,
      values: { [fieldId]: "A subtitle" },
    });
    await flush();

    const latest = (await eventRows(input.workspaceId)).at(-1);
    expect(latest).toMatchObject({
      type: "post_updated",
      source: "dashboard",
      actorType: "user",
      actorId: user.id,
      resourceId: id,
      payload: { id, changes: ["fields"] },
    });
    expect(latest?.enqueuedAt).toBeInstanceOf(Date);
    expect(events.sent.at(-1)).toEqual({
      type: "event.fanout",
      eventId: latest?.id,
    });
    expect(await redis.get(key)).toBeNull();
    expect(
      await client.fields.get({ workspaceId: input.workspaceId, id })
    ).toMatchObject({ values: { [fieldId]: "A subtitle" } });
  });

  it("a commit failure rolls back the post and outbox and clears nothing", async () => {
    const { client, input, events, flush } = await fixture();
    const key = `cache:${input.workspaceId}:posts:v1:list`;
    await redis.set(key, "keep me");
    // A deferred constraint fails at commit, after emitEvent and invalidate
    // have both been recorded. This exercises the actual write's rollback.
    await testDb.db.execute(
      sql`CREATE FUNCTION reject_post_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'post commit rejected'; END $$`
    );
    await testDb.db.execute(
      sql`CREATE CONSTRAINT TRIGGER reject_post_commit AFTER INSERT ON post DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reject_post_commit()`
    );
    try {
      await expect(client.create(input)).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create post",
      });
      await flush();
      expect(
        await testDb.db.query.post.findFirst({
          where: eq(post.workspaceId, input.workspaceId),
        })
      ).toBeUndefined();
      expect(await eventRows(input.workspaceId)).toEqual([]);
      expect(events.sent).toEqual([]);
      expect(await redis.get(key)).toBe("keep me");
    } finally {
      await testDb.db.execute(sql`DROP TRIGGER reject_post_commit ON post`);
      await testDb.db.execute(sql`DROP FUNCTION reject_post_commit()`);
      await redis.del(key);
    }
  });
});

describe("post workspace scoping", () => {
  it("get, update and delete return 404 for another workspace's post ID", async () => {
    const home = await fixture();
    const other = await fixture();
    const { id } = await other.client.create(other.input);
    await other.flush();
    const original = await testDb.db.query.post.findFirst({
      where: eq(post.id, id),
    });
    const notFound = {
      code: "NOT_FOUND",
      status: 404,
      message: "Post not found",
    };

    await expect(
      home.client.get({ workspaceId: home.input.workspaceId, id })
    ).rejects.toMatchObject(notFound);
    await expect(
      home.client.update({ ...home.input, id })
    ).rejects.toMatchObject(notFound);
    await expect(
      home.client.delete({ workspaceId: home.input.workspaceId, id })
    ).rejects.toMatchObject(notFound);
    await expect(
      home.client.fields.get({ workspaceId: home.input.workspaceId, id })
    ).rejects.toMatchObject(notFound);
    await expect(
      home.client.fields.update({
        workspaceId: home.input.workspaceId,
        id,
        values: {},
      })
    ).rejects.toMatchObject(notFound);
    await home.flush();

    expect(
      await testDb.db.query.post.findFirst({ where: eq(post.id, id) })
    ).toEqual(original);
    expect(await eventRows(home.input.workspaceId)).toEqual([]);
    expect(
      (await eventRows(other.input.workspaceId)).map((event) => event.type)
    ).toEqual(["post_created"]);
    expect(home.events.sent).toEqual([]);
  });
});
