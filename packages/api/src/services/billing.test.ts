import { planKey } from "@marble/auth/access";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { createRouterClient } from "@orpc/server";
import { Redis } from "@upstash/redis";
import { afterAll, beforeAll, expect, it } from "vitest";
import { billingRouter } from "../routers/billing";
import {
  createTestContext,
  seedUser,
  seedWorkspace,
  sessionFor,
  testEnv,
} from "../testing";

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

it("only members can clear the workspace's existing usage namespace and cached plan", async () => {
  const redis = new Redis({
    url: testEnv.REDIS_URL,
    token: testEnv.REDIS_TOKEN,
  });
  const user = await seedUser(testDb.db);
  const home = await seedWorkspace(testDb.db, user.id);
  const foreign = await seedWorkspace(testDb.db);
  const usageKey = (id: string) => `usage:meta:${id}`;
  const keys = [
    usageKey(home.id),
    planKey(home.id),
    usageKey(foreign.id),
    planKey(foreign.id),
  ];
  await Promise.all(keys.map((key) => redis.set(key, "stale")));
  try {
    const { context } = createTestContext(testDb.db, {
      session: sessionFor(user),
    });
    const client = createRouterClient(billingRouter, { context });
    await expect(
      client.completeCheckout({ workspaceId: foreign.id })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await Promise.all(keys.map((key) => redis.get(key)))).toEqual([
      "stale",
      "stale",
      "stale",
      "stale",
    ]);
    expect(await client.completeCheckout({ workspaceId: home.id })).toEqual({
      slug: home.slug,
      name: home.name,
    });
    expect(await Promise.all(keys.map((key) => redis.get(key)))).toEqual([
      null,
      null,
      "stale",
      "stale",
    ]);
    const anonymous = createRouterClient(billingRouter, {
      context: createTestContext(testDb.db).context,
    });
    await expect(
      anonymous.completeCheckout({ workspaceId: home.id })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  } finally {
    await redis.del(...keys);
  }
});
