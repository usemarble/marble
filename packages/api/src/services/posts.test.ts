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

type PostInput = Awaited<ReturnType<typeof fixture>>["input"];

function updateInput({ status: _s, publishedAt: _p, ...input }: PostInput) {
  return input;
}

function eventRows(workspaceId: string) {
  return testDb.db.query.workspaceEvent.findMany({
    where: eq(workspaceEvent.workspaceId, workspaceId),
    orderBy: [asc(workspaceEvent.createdAt), asc(workspaceEvent.id)],
  });
}

describe("scheduling from the dashboard", () => {
  const future = () => new Date(Date.now() + 60 * 60_000);

  async function publicationOf(id: string) {
    const row = await testDb.db.query.post.findFirst({
      where: eq(post.id, id),
      columns: { status: true, publishedAt: true },
    });
    return row;
  }

  it("creates a scheduled post without publishing it", async () => {
    const { client, input } = await fixture();
    const publishedAt = future();

    const { id } = await client.create({
      ...input,
      status: "scheduled",
      publishedAt,
    });

    expect(await publicationOf(id)).toEqual({
      status: "scheduled",
      publishedAt,
    });
    const [event] = await eventRows(input.workspaceId);
    expect(event).toMatchObject({
      type: "post_created",
      payload: { status: "scheduled" },
    });
  });

  it("rejects scheduling a time that has passed", async () => {
    const { client, input } = await fixture();

    await expect(
      client.create({
        ...input,
        status: "scheduled",
        publishedAt: new Date(Date.now() - 60_000),
      })
    ).rejects.toMatchObject({ status: 400 });

    const { id } = await client.create(input);
    await expect(
      client.update({
        ...updateInput(input),
        id,
        publication: {
          status: "scheduled",
          publishedAt: new Date(Date.now() - 60_000),
          expectedStatus: "draft",
        },
      })
    ).rejects.toMatchObject({ status: 400 });
    expect(await publicationOf(id)).toMatchObject({ status: "draft" });
  });

  it("emits post_updated for schedule, reschedule and unschedule", async () => {
    const { client, input } = await fixture();
    const { id } = await client.create(input);
    const base = { ...updateInput(input), id };

    await client.update({
      ...base,
      publication: {
        status: "scheduled",
        publishedAt: future(),
        expectedStatus: "draft",
      },
    });
    await client.update({
      ...base,
      publication: {
        status: "scheduled",
        publishedAt: new Date(Date.now() + 2 * 60 * 60_000),
        expectedStatus: "scheduled",
      },
    });
    await client.update({
      ...base,
      publication: { status: "draft", expectedStatus: "scheduled" },
    });

    const rows = await eventRows(input.workspaceId);
    expect(rows.map((event) => event.type)).toEqual([
      "post_created",
      "post_updated",
      "post_updated",
      "post_updated",
    ]);
  });

  it("a save never changes the status or go-live time", async () => {
    const { client, input } = await fixture();
    const publishedAt = future();
    const { id } = await client.create({
      ...input,
      status: "scheduled",
      publishedAt,
    });

    await client.update({ ...updateInput(input), id, title: "Typo fixed" });

    expect(await publicationOf(id)).toEqual({
      status: "scheduled",
      publishedAt,
    });
  });

  it("a save still works on an overdue scheduled post", async () => {
    const { client, input } = await fixture();
    const { id } = await client.create({
      ...input,
      status: "scheduled",
      publishedAt: future(),
    });
    const overdue = new Date(Date.now() - 60_000);
    await testDb.db
      .update(post)
      .set({ publishedAt: overdue })
      .where(eq(post.id, id));

    await client.update({ ...updateInput(input), id, title: "Typo fixed" });

    const row = await testDb.db.query.post.findFirst({
      where: eq(post.id, id),
    });
    expect(row).toMatchObject({
      title: "Typo fixed",
      status: "scheduled",
      publishedAt: overdue,
    });
  });

  it("returns 409 and changes nothing when the status moved underneath the user", async () => {
    const { client, input } = await fixture();
    const publishedAt = new Date("2025-06-01T00:00:00Z");
    const { id } = await client.create({
      ...input,
      status: "published",
      publishedAt,
    });

    await expect(
      client.update({
        ...updateInput(input),
        id,
        title: "Stale tab",
        publication: { status: "draft", expectedStatus: "scheduled" },
      })
    ).rejects.toMatchObject({ status: 409 });

    const row = await testDb.db.query.post.findFirst({
      where: eq(post.id, id),
    });
    expect(row).toMatchObject({ title: input.title, status: "published" });
  });

  describe("the date when a post is published", () => {
    const past = new Date("2021-03-04T00:00:00Z");

    it("becomes now when a scheduled post is published early", async () => {
      const { client, input } = await fixture();
      const { id } = await client.create({
        ...input,
        status: "scheduled",
        publishedAt: future(),
      });
      const before = Date.now();

      await client.update({
        ...updateInput(input),
        id,
        publication: { status: "published", expectedStatus: "scheduled" },
      });

      const row = await publicationOf(id);
      expect(row?.status).toBe("published");
      expect(row?.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(row?.publishedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("stays put when a draft has a past date", async () => {
      const { client, input } = await fixture();
      const { id } = await client.create({ ...input, publishedAt: past });

      await client.update({
        ...updateInput(input),
        id,
        publication: { status: "published", expectedStatus: "draft" },
      });

      expect(await publicationOf(id)).toEqual({
        status: "published",
        publishedAt: past,
      });
    });

    it("becomes now when a draft kept a future date", async () => {
      const { client, input } = await fixture();
      const { id } = await client.create({ ...input, publishedAt: future() });
      const before = Date.now();

      await client.update({
        ...updateInput(input),
        id,
        publication: { status: "published", expectedStatus: "draft" },
      });

      const row = await publicationOf(id);
      expect(row?.publishedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(row?.publishedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("follows a date the request sends, future or past", async () => {
      const { client, input } = await fixture();
      const { id } = await client.create(input);
      const later = future();

      await client.update({
        ...updateInput(input),
        id,
        publication: {
          status: "published",
          publishedAt: later,
          expectedStatus: "draft",
        },
      });
      expect(await publicationOf(id)).toEqual({
        status: "published",
        publishedAt: later,
      });

      await client.update({
        ...updateInput(input),
        id,
        publication: {
          status: "published",
          publishedAt: past,
          expectedStatus: "published",
        },
      });
      expect(await publicationOf(id)).toEqual({
        status: "published",
        publishedAt: past,
      });
    });
  });

  it("opens a scheduled post in the editor", async () => {
    const { client, input } = await fixture();
    const { id } = await client.create({
      ...input,
      status: "scheduled",
      publishedAt: future(),
    });

    await expect(
      client.get({ workspaceId: input.workspaceId, id })
    ).resolves.toMatchObject({ status: "scheduled" });
  });
});

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
      ["draft", "draft", "post_updated"],
      ["draft", "published", "post_published"],
      ["published", "published", "post_updated"],
      ["published", "draft", "post_unpublished"],
    ] as const;
    for (const [expectedStatus, status, eventType] of transitions) {
      const key = `cache:${input.workspaceId}:posts:v1:${id}`;
      await redis.set(key, "stale");
      const values = {
        ...updateInput(input),
        id,
        title: `Edited ${eventType}`,
        publication: { status, expectedStatus },
      };
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
          "featured",
          "customFields",
          "status",
          "publishedAt",
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

describe("scheduled dashboard posts", () => {
  async function scheduledFixture() {
    const f = await fixture();
    const { id } = await f.client.create(f.input);
    await f.flush();
    const publishedAt = new Date("2030-05-01T15:30:00Z");
    await testDb.db
      .update(post)
      .set({ status: "scheduled", publishedAt })
      .where(eq(post.id, id));
    return { ...f, id, publishedAt };
  }

  it("reads scheduled posts through list, filter, counts and pagination", async () => {
    const f = await scheduledFixture();
    const foreign = await scheduledFixture();
    await f.client.create({
      ...f.input,
      slug: createRecordId(),
      status: "published",
      publishedAt: new Date("2031-01-01T00:00:00Z"),
    });
    await f.client.create({ ...f.input, slug: createRecordId() });

    const filtered = await f.client.list({
      workspaceId: f.input.workspaceId,
      status: "scheduled",
      perPage: 1,
    });
    expect(filtered).toMatchObject({
      totalCount: 1,
      pageCount: 1,
      hasAnyPosts: true,
      posts: [{ id: f.id, status: "scheduled", publishedAt: f.publishedAt }],
    });
    const all = await f.client.list({
      workspaceId: f.input.workspaceId,
      perPage: 2,
    });
    expect(all).toMatchObject({ totalCount: 3, pageCount: 2 });
    expect(all.posts.map((row) => row.id)).not.toContain(foreign.id);
    expect(
      (
        await f.client.list({
          workspaceId: f.input.workspaceId,
          status: "published",
        })
      ).posts
    ).toHaveLength(1);
    expect(
      (
        await f.client.list({
          workspaceId: f.input.workspaceId,
          status: "draft",
        })
      ).posts
    ).toHaveLength(1);
    expect(
      (
        await f.client.list({
          workspaceId: f.input.workspaceId,
          status: "scheduled",
          page: 2,
          perPage: 1,
        })
      ).posts
    ).toEqual([]);
  });
});
