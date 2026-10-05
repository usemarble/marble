import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fieldsRouter } from "../routers/fields";
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

describe("dashboard field definitions", () => {
  it("scopes reads and writes, and invalidates field and post caches", async () => {
    const owner = await seedUser(testDb.db);
    const outsider = await seedUser(testDb.db);
    const memberUser = await seedUser(testDb.db);
    const ws = await seedWorkspace(testDb.db, owner.id);
    await seedMember(testDb.db, ws.id, memberUser.id, "member");
    const request = createTestContext(testDb.db, {
      session: sessionFor(owner),
    });
    const client = createRouterClient(fieldsRouter, {
      context: request.context,
    });
    const other = createRouterClient(fieldsRouter, {
      context: createTestContext(testDb.db, { session: sessionFor(outsider) })
        .context,
    });
    const member = createRouterClient(fieldsRouter, {
      context: createTestContext(testDb.db, { session: sessionFor(memberUser) })
        .context,
    });
    const keys = [
      `cache:${ws.id}:fields:v1:list`,
      `cache:${ws.id}:posts:v1:list`,
    ];
    const prime = () => Promise.all(keys.map((key) => redis.set(key, "stale")));
    await expect(other.list({ workspaceId: ws.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await prime();
    const created = await client.create({
      workspaceId: ws.id,
      name: "Color",
      key: "color",
      type: "text",
      options: [],
    });
    await request.flush();
    expect(await Promise.all(keys.map((key) => redis.get(key)))).toEqual([
      null,
      null,
    ]);
    expect((await member.list({ workspaceId: ws.id }))[0]?.id).toBe(created.id);
    await prime();
    await client.update({ workspaceId: ws.id, id: created.id, name: "Colour" });
    await request.flush();
    expect(await Promise.all(keys.map((key) => redis.get(key)))).toEqual([
      null,
      null,
    ]);
    await prime();
    await client.delete({ workspaceId: ws.id, id: created.id });
    await request.flush();
    expect(await Promise.all(keys.map((key) => redis.get(key)))).toEqual([
      null,
      null,
    ]);
    expect(await client.list({ workspaceId: ws.id })).toEqual([]);
  });
});
