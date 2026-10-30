import { createRecordId } from "@marble/db/id";
import { category, post, workspaceEvent } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import type { EventMessage } from "@marble/events";
import { Redis } from "@upstash/redis";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestQueue, seedUser, seedWorkspace, testEnv } from "../testing";
import { publishDuePosts } from "./scheduled-posts";

let testDb: TestDatabase;
const redis = new Redis({ url: testEnv.REDIS_URL, token: testEnv.REDIS_TOKEN });

beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});
// The scan looks across every workspace, so each test starts from no posts.
beforeEach(async () => {
  await testDb.db.delete(workspaceEvent);
  await testDb.db.delete(post);
});

function jobContext(db = testDb.db) {
  const events = createTestQueue<EventMessage>();
  return {
    context: { db, env: testEnv, queues: { events: events.queue } },
    events,
  };
}

async function seedPost(
  workspaceId: string,
  values: { status: "scheduled" | "draft" | "published"; publishedAt: Date }
) {
  const categoryId = createRecordId();
  await testDb.db.insert(category).values({
    id: categoryId,
    name: "News",
    slug: createRecordId(),
    workspaceId,
  });
  const id = createRecordId();
  await testDb.db.insert(post).values({
    id,
    title: "Hello",
    content: "<p>Hello</p>",
    contentJson: { type: "doc", content: [] },
    description: "A post",
    slug: createRecordId(),
    categoryId,
    workspaceId,
    ...values,
  });
  return id;
}

async function seedScheduledPost(publishedAt: Date) {
  const user = await seedUser(testDb.db);
  const workspace = await seedWorkspace(testDb.db, user.id);
  const id = await seedPost(workspace.id, {
    status: "scheduled",
    publishedAt,
  });
  return { id, workspaceId: workspace.id };
}

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve: () => resolve() };
}

const postRow = (id: string) =>
  testDb.db.query.post.findFirst({ where: eq(post.id, id) });
const eventsFor = (id: string) =>
  testDb.db.query.workspaceEvent.findMany({
    where: eq(workspaceEvent.resourceId, id),
  });

const dueAt = new Date("2026-10-23T09:00:00.000Z");
const now = new Date("2026-10-23T09:00:30.000Z");

describe("publishDuePosts", () => {
  it("publishes a due post with one system event and keeps its scheduled time", async () => {
    const { id, workspaceId } = await seedScheduledPost(dueAt);
    const { context, events } = jobContext();

    const result = await publishDuePosts(context, { now });

    expect(result).toEqual({ published: 1, failed: 0 });
    expect(await postRow(id)).toMatchObject({
      status: "published",
      publishedAt: dueAt,
    });
    const rows = await eventsFor(id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: "post_published",
      workspaceId,
      source: "system",
      actorType: "system",
      actorId: null,
      payload: {
        id,
        status: "published",
        publishedAt: "2026-10-23T09:00:00.000Z",
      },
    });
    expect(rows[0]?.enqueuedAt).toBeInstanceOf(Date);
    expect(events.sent).toEqual([
      { type: "event.fanout", eventId: rows[0]?.id },
    ]);
  });

  it("leaves future posts, drafts and published posts alone", async () => {
    const user = await seedUser(testDb.db);
    const { id: workspaceId } = await seedWorkspace(testDb.db, user.id);
    const later = new Date(now.getTime() + 60_000);
    const future = await seedPost(workspaceId, {
      status: "scheduled",
      publishedAt: later,
    });
    const draft = await seedPost(workspaceId, {
      status: "draft",
      publishedAt: dueAt,
    });
    const live = await seedPost(workspaceId, {
      status: "published",
      publishedAt: later,
    });
    const { context, events } = jobContext();

    expect(await publishDuePosts(context, { now })).toEqual({
      published: 0,
      failed: 0,
    });

    expect((await postRow(future))?.status).toBe("scheduled");
    expect((await postRow(draft))?.status).toBe("draft");
    expect((await postRow(live))?.status).toBe("published");
    expect(events.sent).toEqual([]);
  });

  it("clears the cache before it sends the webhook event", async () => {
    const { workspaceId } = await seedScheduledPost(dueAt);
    const key = `cache:${workspaceId}:posts:v1:list`;
    await redis.set(key, "stale");
    const cachedWhenSent: unknown[] = [];
    const { context } = jobContext();

    await publishDuePosts(
      {
        ...context,
        queues: {
          events: {
            send: async () => {
              cachedWhenSent.push(await redis.get(key));
            },
          },
        },
      },
      { now }
    );

    expect(cachedWhenSent).toEqual([null]);
  });

  it("still sends the event when the cache can't be cleared", async () => {
    await seedScheduledPost(dueAt);
    const { context, events } = jobContext();

    const result = await publishDuePosts(
      {
        ...context,
        env: { REDIS_URL: "http://localhost:1", REDIS_TOKEN: "unreachable" },
      },
      { now }
    );

    expect(result.published).toBe(1);
    expect(events.sent).toHaveLength(1);
  });

  it("leaves a failed send for the outbox sweep", async () => {
    const { id } = await seedScheduledPost(dueAt);
    const { context, events } = jobContext();
    events.queue.failing = true;

    await publishDuePosts(context, { now });

    expect((await postRow(id))?.status).toBe("published");
    const [event] = await eventsFor(id);
    expect(event?.enqueuedAt).toBeNull();
  });

  it("stops at the limit and takes the rest on the next run", async () => {
    await seedScheduledPost(dueAt);
    await seedScheduledPost(dueAt);
    await seedScheduledPost(dueAt);
    const { context } = jobContext();

    expect(await publishDuePosts(context, { now, limit: 2 })).toEqual({
      published: 2,
      failed: 0,
    });
    expect(await publishDuePosts(context, { now, limit: 2 })).toEqual({
      published: 1,
      failed: 0,
    });
  });

  it("publishes once when two runs overlap", async () => {
    const posts = await Promise.all([
      seedScheduledPost(dueAt),
      seedScheduledPost(dueAt),
      seedScheduledPost(dueAt),
      seedScheduledPost(dueAt),
    ]);
    const other = await testDb.connect();
    const first = jobContext();
    const second = jobContext(other);

    const results = await Promise.all([
      publishDuePosts(first.context, { now }),
      publishDuePosts(second.context, { now }),
    ]);

    expect(results[0].published + results[1].published).toBe(posts.length);
    for (const { id } of posts) {
      expect(await eventsFor(id)).toHaveLength(1);
    }
    expect(first.events.sent.length + second.events.sent.length).toBe(
      posts.length
    );
  });

  it("skips a post a user is writing, then publishes it on the next run", async () => {
    const { id } = await seedScheduledPost(dueAt);
    const other = await testDb.connect();
    const { context } = jobContext();
    const held = deferred();
    const locked = deferred();

    const userWrite = other.transaction(async (tx) => {
      await tx.select().from(post).where(eq(post.id, id)).for("update");
      locked.resolve();
      await held.promise;
    });
    await locked.promise;

    expect((await publishDuePosts(context, { now })).published).toBe(0);

    held.resolve();
    await userWrite;
    expect((await publishDuePosts(context, { now })).published).toBe(1);
  });

  it("skips a post that fails and still publishes the others", async () => {
    const bad = await seedScheduledPost(dueAt);
    const good = await seedScheduledPost(new Date(dueAt.getTime() + 1000));
    await testDb.db.execute(`
      CREATE OR REPLACE FUNCTION reject_post() RETURNS trigger AS $$
      BEGIN
        IF NEW.id = '${bad.id}' THEN
          RAISE EXCEPTION 'poison row';
        END IF;
        RETURN NEW;
      END $$ LANGUAGE plpgsql;
    `);
    await testDb.db.execute(`
      CREATE TRIGGER reject_post BEFORE UPDATE ON post
      FOR EACH ROW EXECUTE FUNCTION reject_post();
    `);
    const { context } = jobContext();

    try {
      const result = await publishDuePosts(context, { now });

      expect(result).toEqual({ published: 1, failed: 1 });
      expect((await postRow(bad.id))?.status).toBe("scheduled");
      expect((await postRow(good.id))?.status).toBe("published");
    } finally {
      await testDb.db.execute("DROP TRIGGER reject_post ON post");
      await testDb.db.execute("DROP FUNCTION reject_post");
    }
  });
});
