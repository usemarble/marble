import { createRecordId } from "@marble/db/id";
import { media, workspaceEvent } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mediaRouter } from "../routers/media";
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

describe("dashboard media", () => {
  it("scopes reads, verifies member access, deletes R2 objects and invalidates caches", async () => {
    const actor = await seedUser(testDb.db);
    const memberUser = await seedUser(testDb.db);
    const outsider = await seedUser(testDb.db);
    const ws = await seedWorkspace(testDb.db, actor.id);
    const otherWs = await seedWorkspace(testDb.db, outsider.id);
    await seedMember(testDb.db, ws.id, memberUser.id, "member");
    const id = createRecordId();
    const key = `media/${ws.id}/${id}.png`;
    await testDb.db.insert(media).values({
      id,
      workspaceId: ws.id,
      storageKey: key,
      url: `${testEnv.STORAGE_PUBLIC_URL}/${key}`,
      name: "test.png",
      type: "image",
      size: 19,
      mimeType: "image/png",
    });
    const deleted: string[] = [];
    const request = createTestContext(testDb.db, {
      session: sessionFor(actor),
      env: {
        ...testEnv,
        STORAGE: {
          ...testEnv.STORAGE,
          delete: async (value: string | string[]) => {
            deleted.push(...(Array.isArray(value) ? value : [value]));
          },
        },
      },
    });
    const client = createRouterClient(mediaRouter, {
      context: request.context,
    });
    const memberClient = createRouterClient(mediaRouter, {
      context: createTestContext(testDb.db, { session: sessionFor(memberUser) })
        .context,
    });
    const otherClient = createRouterClient(mediaRouter, {
      context: createTestContext(testDb.db, { session: sessionFor(outsider) })
        .context,
    });
    expect(
      (
        await client.list({
          workspaceId: ws.id,
          page: 1,
          perPage: 20,
          sort: "createdAt_desc",
        })
      ).media[0]?.id
    ).toBe(id);
    expect((await memberClient.get({ workspaceId: ws.id, id })).id).toBe(id);
    await expect(
      otherClient.get({ workspaceId: ws.id, id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      otherClient.get({ workspaceId: otherWs.id, id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const keys = [
      `cache:${ws.id}:media:v1:list`,
      `cache:${ws.id}:posts:v1:list`,
    ];
    const prime = () =>
      Promise.all(keys.map((value) => redis.set(value, "stale")));
    await prime();
    await client.update({
      workspaceId: ws.id,
      id,
      name: "renamed.png",
      alt: "Image",
    });
    await request.flush();
    expect(await Promise.all(keys.map((value) => redis.get(value)))).toEqual([
      null,
      null,
    ]);
    await prime();
    const result = await client.delete({ workspaceId: ws.id, mediaIds: [id] });
    await request.flush();
    expect(result.deletedIds).toEqual([id]);
    expect(deleted).toEqual([key]);
    expect(await Promise.all(keys.map((value) => redis.get(value)))).toEqual([
      null,
      null,
    ]);
    expect(
      await testDb.db.query.media.findFirst({ where: eq(media.id, id) })
    ).toBeUndefined();
    const events = await testDb.db
      .select()
      .from(workspaceEvent)
      .where(eq(workspaceEvent.workspaceId, ws.id));
    expect(events.map((event) => event.type)).toEqual([
      "media_updated",
      "media_deleted",
    ]);
  });
});
