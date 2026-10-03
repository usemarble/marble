import { webhookEndpoint, workspaceEvent } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import type { EventMessage } from "@marble/events";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { webhooksRouter } from "../routers/webhooks";
import {
  createTestContext,
  createTestQueue,
  seedUser,
  seedWorkspace,
  sessionFor,
  testEnv,
} from "../testing";
import { sweepEvents } from "./events";

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
  const request = createTestContext(testDb.db, { session: sessionFor(user) });
  const client = createRouterClient(webhooksRouter, {
    context: request.context,
  });
  const input = {
    workspaceId: workspace.id,
    name: "Hook",
    endpoint: "https://example.com/events",
    events: ["tag_created" as const],
    format: "json" as const,
  };
  return { ...request, user, client, input };
}
const rows = (workspaceId: string) =>
  testDb.db.query.workspaceEvent.findMany({
    where: eq(workspaceEvent.workspaceId, workspaceId),
  });

describe("dashboard webhooks", () => {
  it("CRUD retains the CMS's absence of events/cache clears and hides the list secret", async () => {
    const f = await fixture();
    const key = `cache:${f.input.workspaceId}:posts:v1:list`;
    await redis.set(key, "keep");
    try {
      const hook = await f.client.create(f.input);
      expect(hook.secret).toMatch(/^[a-f0-9]{64}$/);
      expect(
        (await f.client.list({ workspaceId: f.input.workspaceId }))[0]
      ).not.toHaveProperty("secret");
      expect(
        (await f.client.get({ workspaceId: f.input.workspaceId, id: hook.id }))
          .webhook.secret
      ).toBe(hook.secret);
      await f.client.update({
        workspaceId: f.input.workspaceId,
        id: hook.id,
        name: "Edited",
        enabled: false,
      });
      await f.client.delete({ workspaceId: f.input.workspaceId, id: hook.id });
      await f.flush();
      expect(await rows(f.input.workspaceId)).toEqual([]);
      expect(f.events.sent).toEqual([]);
      expect(await redis.get(key)).toBe("keep");
    } finally {
      await redis.del(key);
    }
  });

  it("a disabled endpoint with no post subscription can receive a targeted, non-billable test", async () => {
    const f = await fixture();
    const hook = await f.client.create(f.input);
    await f.client.update({
      workspaceId: f.input.workspaceId,
      id: hook.id,
      enabled: false,
    });
    const result = await f.client.test({
      workspaceId: f.input.workspaceId,
      id: hook.id,
    });
    await f.flush();
    const [event] = await rows(f.input.workspaceId);
    expect(event).toMatchObject({
      id: result.eventId,
      type: "post_published",
      source: "dashboard",
      actorType: "user",
      actorId: f.user.id,
      resourceType: "post",
      resourceId: "test",
      payload: { title: expect.any(String) },
    });
    expect(event?.enqueuedAt).toBeInstanceOf(Date);
    expect(f.events.sent).toEqual([
      {
        type: "event.fanout",
        eventId: result.eventId,
        targetWebhookEndpointId: hook.id,
        isTest: true,
      },
    ]);
  });

  it("a failed test send returns an error and its row can never be broadcast by the sweep", async () => {
    const f = await fixture();
    const hook = await f.client.create(f.input);
    f.events.queue.failing = true;
    await expect(
      f.client.test({ workspaceId: f.input.workspaceId, id: hook.id })
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create event",
    });
    const [event] = await rows(f.input.workspaceId);
    expect(event?.enqueuedAt).toBeInstanceOf(Date);
    const queue = createTestQueue<EventMessage>();
    expect(
      await sweepEvents(
        { db: testDb.db, queue: queue.queue },
        { now: new Date(Date.now() + 120_000) }
      )
    ).toBe(0);
    expect(queue.sent).toEqual([]);
    f.events.queue.failing = false;
    await f.client.test({ workspaceId: f.input.workspaceId, id: hook.id });
    expect(f.events.sent).toHaveLength(1);
  });

  it("a rolled-back test inserts no event and sends nothing", async () => {
    const f = await fixture();
    const hook = await f.client.create(f.input);
    await testDb.db.execute(
      sql`CREATE FUNCTION reject_test_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test commit rejected'; END $$`
    );
    await testDb.db.execute(
      sql`CREATE CONSTRAINT TRIGGER reject_test_commit AFTER INSERT ON workspace_event DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reject_test_commit()`
    );
    try {
      await expect(
        f.client.test({ workspaceId: f.input.workspaceId, id: hook.id })
      ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
      await f.flush();
      expect(await rows(f.input.workspaceId)).toEqual([]);
      expect(f.events.sent).toEqual([]);
    } finally {
      await testDb.db.execute(
        sql`DROP TRIGGER reject_test_commit ON workspace_event`
      );
      await testDb.db.execute(sql`DROP FUNCTION reject_test_commit()`);
    }
  });

  it("get, update, delete and test return 404 for another workspace's endpoint", async () => {
    const home = await fixture();
    const other = await fixture();
    const hook = await other.client.create(other.input);
    const input = { workspaceId: home.input.workspaceId, id: hook.id };
    for (const proc of [
      home.client.get,
      home.client.update,
      home.client.delete,
      home.client.test,
    ]) {
      await expect(proc(input)).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
        message: "Webhook not found",
      });
    }
    expect(await rows(home.input.workspaceId)).toEqual([]);
    expect(home.events.sent).toEqual([]);
  });

  it("a caller without workspace membership gets 403 on every procedure", async () => {
    const f = await fixture();
    const outsider = await seedUser(testDb.db);
    const client = createRouterClient(webhooksRouter, {
      context: createTestContext(testDb.db, { session: sessionFor(outsider) })
        .context,
    });
    const hook = await f.client.create(f.input);
    const input = { workspaceId: f.input.workspaceId, id: hook.id };
    for (const proc of [
      client.list,
      client.get,
      client.update,
      client.delete,
      client.test,
    ]) {
      await expect(proc(input)).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    }
    await expect(client.create(f.input)).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});
