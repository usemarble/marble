import { createRecordId } from "@marble/db/id";
import { member, subscription } from "@marble/db/schema";
import { createTestDatabase, type TestDatabase } from "@marble/db/testing";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestContext,
  seedUser,
  seedWorkspace,
  sessionFor,
  testEnv,
} from "../testing";
import {
  AssistantError,
  authorizeChat,
  requireVerifiedSession,
} from "./assistant";

const redis = new Redis({
  url: testEnv.REDIS_URL,
  token: testEnv.REDIS_TOKEN,
});

async function keysMatching(pattern: string) {
  const found: string[] = [];
  let cursor: string | number = "0";
  do {
    const [next, keys]: [string | number, string[]] = await redis.scan(cursor, {
      match: pattern,
      count: 1000,
    });
    found.push(...keys);
    cursor = next;
  } while (String(cursor) !== "0");
  return found;
}

let testDb: TestDatabase;
beforeAll(async () => {
  testDb = await createTestDatabase();
});
afterAll(async () => {
  await testDb.close();
});

async function fixture(paid = true) {
  const user = await seedUser(testDb.db);
  const workspace = await seedWorkspace(testDb.db, user.id);
  if (paid) {
    await testDb.db.insert(subscription).values({
      id: createRecordId(),
      workspaceId: workspace.id,
      userId: user.id,
      plan: "hobby",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 86_400_000),
      cancelAtPeriodEnd: false,
      polarId: createRecordId(),
    });
  }
  return {
    user,
    workspace,
    ctx: createTestContext(testDb.db, { session: sessionFor(user) }).context,
  };
}

async function failure(work: Promise<unknown>) {
  try {
    await work;
  } catch (error) {
    if (error instanceof AssistantError) {
      return error;
    }
    throw error;
  }
  throw new Error("expected an AssistantError");
}

describe("requireVerifiedSession", () => {
  it("is a 401 without a session or with an unverified email", async () => {
    expect(() => requireVerifiedSession(null)).toThrowError(
      expect.objectContaining({ status: 401 })
    );
    const unverified = await seedUser(testDb.db, false);
    expect(() => requireVerifiedSession(sessionFor(unverified))).toThrowError(
      expect.objectContaining({ status: 401 })
    );
  });

  it("returns a verified session", async () => {
    const user = await seedUser(testDb.db);
    const session = sessionFor(user);
    expect(requireVerifiedSession(session)).toBe(session);
  });
});

describe("authorizeChat", () => {
  it("returns the workspace name for a member on a paid plan", async () => {
    const { user, workspace, ctx } = await fixture();
    await expect(authorizeChat(ctx, user.id, workspace.id)).resolves.toEqual({
      workspaceName: workspace.name,
    });
  });

  it("is a 403 for a user who is not a member, before any limiter runs", async () => {
    const { workspace, ctx } = await fixture();
    const outsider = await seedUser(testDb.db);

    const error = await failure(authorizeChat(ctx, outsider.id, workspace.id));

    expect(error.status).toBe(403);
    expect(error.message).toBe("You do not have access to this workspace");
    expect(await keysMatching(`ai-assistant-*:${outsider.id}*`)).toEqual([]);
  });

  it("is a 403 on the free plan, before any limiter runs", async () => {
    const { user, workspace, ctx } = await fixture(false);

    const error = await failure(authorizeChat(ctx, user.id, workspace.id));

    expect(error.status).toBe(403);
    expect(error.message).toBe("Upgrade to Hobby to use the AI assistant");
    expect(await keysMatching(`ai-assistant-*:${user.id}*`)).toEqual([]);
  });

  it("is a 429 with Retry-After past 10 messages a minute", async () => {
    const { user, workspace, ctx } = await fixture();
    for (let i = 0; i < 10; i++) {
      await authorizeChat(ctx, user.id, workspace.id);
    }

    const error = await failure(authorizeChat(ctx, user.id, workspace.id));

    expect(error.status).toBe(429);
    expect(error.message).toMatch(/too fast/);
    expect(error.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(error.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("is a 429 once the day's cap is spent, with a Retry-After longer than a minute", async () => {
    const { user, workspace, ctx } = await fixture();
    const daily = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "24 h"),
      prefix: "ai-assistant-daily-rate-limit",
    });
    await Promise.all(Array.from({ length: 100 }, () => daily.limit(user.id)));

    const error = await failure(authorizeChat(ctx, user.id, workspace.id));

    expect(error.status).toBe(429);
    expect(error.message).toMatch(/today/);
    expect(error.retryAfterSeconds).toBeGreaterThan(60);
  });

  it("limits per user, not per workspace", async () => {
    const { user, workspace, ctx } = await fixture();
    for (let i = 0; i < 10; i++) {
      await authorizeChat(ctx, user.id, workspace.id);
    }
    await failure(authorizeChat(ctx, user.id, workspace.id));

    const teammate = await seedUser(testDb.db);
    await testDb.db.insert(member).values({
      id: createRecordId(),
      organizationId: workspace.id,
      userId: teammate.id,
      role: "member",
    });

    await expect(
      authorizeChat(ctx, teammate.id, workspace.id)
    ).resolves.toBeDefined();
  });

  it("uses its own limiter keys, not the suggestions limiter's", async () => {
    const { user, workspace, ctx } = await fixture();
    await authorizeChat(ctx, user.id, workspace.id);

    expect(
      (await keysMatching(`ai-assistant-minute-rate-limit:${user.id}:*`)).length
    ).toBeGreaterThan(0);
    expect(
      (await keysMatching(`ai-assistant-daily-rate-limit:${user.id}:*`)).length
    ).toBeGreaterThan(0);
    expect(
      await keysMatching(`ai-suggestions-rate-limit:*${user.id}*`)
    ).toEqual([]);
  });
});
