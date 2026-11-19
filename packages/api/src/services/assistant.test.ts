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
import { AssistantError, authorizeChat } from "./assistant";

const redis = new Redis({
  url: testEnv.REDIS_URL,
  token: testEnv.REDIS_TOKEN,
});

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

describe("authorizeChat", () => {
  it("returns the workspace name for a member on a paid plan", async () => {
    const { user, workspace, ctx } = await fixture();
    await expect(authorizeChat(ctx, user.id, workspace.id)).resolves.toEqual({
      workspaceName: workspace.name,
    });
  });

  it("is a 403 for a user who is not a member", async () => {
    const { workspace, ctx } = await fixture();
    const outsider = await seedUser(testDb.db);

    const error = await failure(authorizeChat(ctx, outsider.id, workspace.id));

    expect(error.status).toBe(403);
    expect(error.message).toBe("You do not have access to this workspace");
  });

  it("is a 403 on the free plan", async () => {
    const { user, workspace, ctx } = await fixture(false);

    const error = await failure(authorizeChat(ctx, user.id, workspace.id));

    expect(error.status).toBe(403);
    expect(error.message).toBe("Upgrade to Hobby to use the AI assistant");
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
});
