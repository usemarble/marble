import { apiKey, workspaceEvent } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import {
  DEFAULT_PRIVATE_API_KEY_SCOPES,
  DEFAULT_PUBLIC_API_KEY_SCOPES,
  hashApiKey,
} from "@marble/utils";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { keysRouter } from "../routers/keys";
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
  const request = createTestContext(testDb.db, { session: sessionFor(user) });
  const client = createRouterClient(keysRouter, { context: request.context });
  return {
    ...request,
    client,
    input: { workspaceId: workspace.id, name: "Key", type: "public" as const },
  };
}

describe("dashboard API keys", () => {
  it.each(["public", "private"] as const)(
    "%s CRUD preserves defaults and discloses the plaintext only on creation",
    async (type) => {
      const f = await fixture();
      const cache = `cache:${f.input.workspaceId}:posts:v1:list`;
      await redis.set(cache, "keep");
      try {
        const created = await f.client.create({ ...f.input, type });
        expect(created.scopes).toEqual(
          type === "public"
            ? DEFAULT_PUBLIC_API_KEY_SCOPES
            : DEFAULT_PRIVATE_API_KEY_SCOPES
        );
        const row = await testDb.db.query.apiKey.findFirst({
          where: eq(apiKey.id, created.id),
        });
        expect(row?.key).toBe(hashApiKey(created.key));
        expect(row?.key).not.toBe(created.key);
        expect(row).toMatchObject({
          rateLimitTimeWindow: 86_400_000,
          rateLimitMax: 1000,
          enabled: true,
        });
        expect(
          (await f.client.list({ workspaceId: f.input.workspaceId }))[0]
        ).not.toHaveProperty("key");
        const input = { workspaceId: f.input.workspaceId, id: created.id };
        expect(await f.client.get(input)).not.toHaveProperty("key");
        const expiresAt = new Date("2027-01-01T00:00:00Z");
        const updated = await f.client.update({
          ...input,
          name: "Edited",
          enabled: false,
          scopes: [],
          expiresAt,
        });
        expect(updated).toMatchObject({
          name: "Edited",
          enabled: false,
          scopes: [],
          expiresAt,
        });
        expect(updated).not.toHaveProperty("key");
        await f.client.update({ ...input, expiresAt: null });
        expect((await f.client.get(input)).expiresAt).toBeNull();
        await f.client.delete(input);
        await f.flush();
        expect(
          await f.client.list({ workspaceId: f.input.workspaceId })
        ).toEqual([]);
        expect(
          await testDb.db.query.workspaceEvent.findMany({
            where: eq(workspaceEvent.workspaceId, f.input.workspaceId),
          })
        ).toEqual([]);
        expect(f.events.sent).toEqual([]);
        expect(await redis.get(cache)).toBe("keep");
      } finally {
        await redis.del(cache);
      }
    }
  );

  it("rejects private-only scopes on public keys on create and update", async () => {
    const f = await fixture();
    const error = {
      code: "BAD_REQUEST",
      message: "Public API keys cannot include private-only scopes",
      data: { details: ["posts_write"] },
    };
    await expect(
      f.client.create({ ...f.input, scopes: ["posts_write"] })
    ).rejects.toMatchObject(error);
    const created = await f.client.create(f.input);
    await expect(
      f.client.update({
        workspaceId: f.input.workspaceId,
        id: created.id,
        scopes: ["posts_write"],
      })
    ).rejects.toMatchObject(error);
    expect(
      (await f.client.get({ workspaceId: f.input.workspaceId, id: created.id }))
        .scopes
    ).toEqual(DEFAULT_PUBLIC_API_KEY_SCOPES);
  });

  it("a commit failure rolls back the key and sends/clears nothing", async () => {
    const f = await fixture();
    const cache = `cache:${f.input.workspaceId}:posts:v1:list`;
    await redis.set(cache, "keep");
    await testDb.db.execute(
      sql`CREATE FUNCTION reject_key_commit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'key commit rejected'; END $$`
    );
    await testDb.db.execute(
      sql`CREATE CONSTRAINT TRIGGER reject_key_commit AFTER INSERT ON api_key DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION reject_key_commit()`
    );
    try {
      await expect(f.client.create(f.input)).rejects.toThrow();
      await f.flush();
      expect(await f.client.list({ workspaceId: f.input.workspaceId })).toEqual(
        []
      );
      expect(
        await testDb.db.query.workspaceEvent.findMany({
          where: eq(workspaceEvent.workspaceId, f.input.workspaceId),
        })
      ).toEqual([]);
      expect(f.events.sent).toEqual([]);
      expect(await redis.get(cache)).toBe("keep");
    } finally {
      await testDb.db.execute(sql`DROP TRIGGER reject_key_commit ON api_key`);
      await testDb.db.execute(sql`DROP FUNCTION reject_key_commit()`);
      await redis.del(cache);
    }
  });

  it("get, update and delete return 404 for another workspace's key", async () => {
    const home = await fixture();
    const other = await fixture();
    const key = await other.client.create(other.input);
    for (const proc of [
      home.client.get,
      home.client.update,
      home.client.delete,
    ]) {
      await expect(
        proc({ workspaceId: home.input.workspaceId, id: key.id })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        status: 404,
        message: "API key not found",
      });
    }
    expect(
      (
        await other.client.get({
          workspaceId: other.input.workspaceId,
          id: key.id,
        })
      ).name
    ).toBe("Key");
  });

  it("a caller without workspace membership gets 403 on every procedure", async () => {
    const f = await fixture();
    const outsider = await seedUser(testDb.db);
    const client = createRouterClient(keysRouter, {
      context: createTestContext(testDb.db, { session: sessionFor(outsider) })
        .context,
    });
    const key = await f.client.create(f.input);
    const input = { workspaceId: f.input.workspaceId, id: key.id };
    for (const proc of [
      client.list,
      client.get,
      client.update,
      client.delete,
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
